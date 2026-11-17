import type { AdminClient } from "@/lib/supabase/admin";
import { MAX_CONSECUTIVE_FAILURES } from "./constants";

/** 실패 1회를 기록한 뒤의 상태 */
export type FailureStatus = { blocked: boolean; newlyBlocked: boolean };

/**
 * IP가 차단 중인지 본다. 조회에 실패하면 차단하지 않고 로그만 남긴다(이 경우 이후 단계도 같은 DB를 쓰므로 어차피 실패한다).
 * @param admin 서비스 키 클라이언트
 * @param ip 정규화된 IP
 */
export async function isIpBlocked(
  admin: AdminClient,
  ip: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from("admin_ip_attempts")
    .select("blocked_at")
    .eq("ip", ip)
    .maybeSingle();
  if (error) console.error("[auth] 차단 여부 조회 실패", error.message);
  return Boolean(data?.blocked_at);
}

/**
 * 연속 실패를 1회 기록한다. DB 함수가 행을 잠근 채 증가·차단을 판정하므로 동시 요청에도 횟수가 새지 않는다.
 * @param admin 서비스 키 클라이언트
 * @param ip 정규화된 IP
 */
export async function registerLoginFailure(
  admin: AdminClient,
  ip: string,
): Promise<FailureStatus> {
  const { data, error } = await admin.rpc("register_login_failure", {
    p_ip: ip,
    p_limit: MAX_CONSECUTIVE_FAILURES,
  });
  const row = data?.[0];
  if (error || !row) {
    console.error("[auth] 로그인 실패 기록 실패", error?.message);
    return { blocked: false, newlyBlocked: false };
  }
  return { blocked: row.blocked, newlyBlocked: row.newly_blocked };
}

/**
 * 로그인에 성공하면 그 IP의 연속 실패 횟수를 0으로 되돌린다. 이미 차단된 IP는 건드리지 않는다.
 * @param admin 서비스 키 클라이언트
 * @param ip 정규화된 IP
 */
export async function resetLoginFailures(
  admin: AdminClient,
  ip: string,
): Promise<void> {
  const { error } = await admin
    .from("admin_ip_attempts")
    .update({ consecutive_failures: 0 })
    .eq("ip", ip)
    .is("blocked_at", null);
  if (error) console.error("[auth] 실패 횟수 초기화 실패", error.message);
}

/**
 * 최근 1시간 안에 새로 생긴 차단 수를 센다(차단 알림 메일의 시간당 상한 판정용).
 * @param admin 서비스 키 클라이언트
 */
export async function countRecentBlocks(admin: AdminClient): Promise<number> {
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await admin
    .from("admin_ip_attempts")
    .select("ip", { count: "exact", head: true })
    .gte("blocked_at", since);
  return count ?? 0;
}
