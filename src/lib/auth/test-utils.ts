import type { AdminClient } from "@/lib/supabase/admin";

/** 가짜 쿼리가 돌려줄 결과 */
export type FakeResult = {
  data?: unknown;
  error?: { message: string } | null;
  count?: number | null;
};

/** 기록된 쿼리 호출 하나 */
export type FakeCall = {
  table: string;
  op: string;
  payload: unknown;
  filters: [string, unknown[]][];
};

const WRITE_OPS = ["insert", "update", "delete", "upsert"];

/**
 * 테스트용 가짜 서비스 키 클라이언트. 체인(from().select().eq()…)을 기록하고,
 * await 하면 `테이블.동작`(예: admin_trusted_ips.update) 또는 `rpc.함수명` 키의 큐에서 다음 결과를 꺼내 준다.
 * @param queue 키별 결과 큐 (비면 { data: null, error: null })
 */
export function createFakeAdmin(queue: Record<string, FakeResult[]> = {}) {
  const calls: FakeCall[] = [];

  /** 큐에서 다음 결과를 꺼낸다 */
  const next = (key: string): FakeResult =>
    queue[key]?.shift() ?? { data: null, error: null };

  function from(table: string) {
    const call: FakeCall = { table, op: "select", payload: null, filters: [] };
    const chain: unknown = new Proxy(
      {},
      {
        get(_, name: string) {
          if (name === "then") {
            return (resolve: (value: FakeResult) => void) => {
              calls.push(call);
              resolve(next(`${table}.${call.op}`));
            };
          }
          return (...args: unknown[]) => {
            if (WRITE_OPS.includes(name)) {
              call.op = name;
              call.payload = args[0];
            } else if (name !== "select") {
              call.filters.push([name, args]);
            }
            return chain;
          };
        },
      },
    );
    return chain;
  }

  const rpc = async (name: string, args: unknown) => {
    calls.push({ table: "rpc", op: name, payload: args, filters: [] });
    return next(`rpc.${name}`);
  };

  return { admin: { from, rpc } as unknown as AdminClient, calls };
}
