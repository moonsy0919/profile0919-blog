import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDevLog, getDevLogs } from "./reads-dev-logs";

type Result = { data?: unknown; count?: number | null; error?: unknown };

/** 호출 기록을 남기는 Supabase 쿼리 빌더 대역. await하면 지정한 결과를 돌려준다 */
function makeQuery(result: Result) {
  const query: Record<string, unknown> = {};
  for (const method of [
    "select",
    "eq",
    "order",
    "range",
    "maybeSingle",
    "overrideTypes",
  ]) {
    query[method] = vi.fn(() => query);
  }
  query.then = (
    resolve: (value: Result) => unknown,
    reject: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(resolve, reject);
  return query as Record<string, ReturnType<typeof vi.fn>> & {
    then: unknown;
  };
}

type Query = ReturnType<typeof makeQuery>;

const from = vi.fn();
let queries: Query[] = [];

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from }),
}));

/**
 * from()이 호출될 때마다 순서대로 결과를 돌려주도록 예약한다.
 * @param results 호출 순서대로의 쿼리 결과
 */
function queueResults(...results: Result[]) {
  queries = results.map(makeQuery);
  for (const query of queries) from.mockImplementationOnce(() => query);
}

/** 도메인 변환 확인용 DB 행 */
function row(id: string, tags: { id: string; name: string }[] = []) {
  return {
    id,
    title: `제목 ${id}`,
    content: `본문 ${id}`,
    thumbnail_url: null,
    github_url: "https://github.com/me/repo",
    created_at: "2026-11-11T00:00:00Z",
    updated_at: "2026-11-12T00:00:00Z",
    dev_log_tags: tags.map((tag) => ({ tags: tag })),
  };
}

const UUID = "123e4567-e89b-12d3-a456-426614174000";
const fourRows = ["1", "2", "3", "4"].map((id) => row(id));

beforeEach(() => {
  from.mockReset();
  queries = [];
});

describe("getDevLogs", () => {
  it("한 페이지에 4개씩 최신순으로 조회하고 전체 개수를 함께 돌려준다", async () => {
    queueResults({ count: 5 }, { data: fourRows });
    const result = await getDevLogs();

    expect(result).toMatchObject({ total: 5, page: 1, pageSize: 4 });
    expect(result.items).toHaveLength(4);
    const [count, list] = queries;
    expect(count.eq).not.toHaveBeenCalled();
    expect(list.order).toHaveBeenNthCalledWith(1, "created_at", {
      ascending: false,
    });
    expect(list.order).toHaveBeenNthCalledWith(2, "id", { ascending: false });
    expect(list.range).toHaveBeenCalledWith(0, 3);
  });

  it("2페이지는 4번째 다음부터 조회한다", async () => {
    queueResults({ count: 5 }, { data: [row("5")] });
    const result = await getDevLogs({ page: 2 });

    expect(queries[1].range).toHaveBeenCalledWith(4, 7);
    expect(result).toMatchObject({ page: 2, total: 5 });
  });

  it("범위를 벗어난 page는 마지막 페이지로 보정해 조회한다", async () => {
    queueResults({ count: 5 }, { data: [row("5")] });
    const result = await getDevLogs({ page: 999 });

    expect(result.page).toBe(2);
    expect(queries[1].range).toHaveBeenCalledWith(4, 7);
  });

  it("4개 미만이면 있는 만큼만 돌려준다", async () => {
    queueResults({ count: 2 }, { data: [row("1"), row("2")] });
    const result = await getDevLogs();

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("행을 도메인 개발 일기로 바꾸고 태그는 이름순이며 빈 태그 연결은 뺀다", async () => {
    const tagged = row("1", [
      { id: "t2", name: "일상" },
      { id: "t1", name: "개발" },
    ]);
    tagged.dev_log_tags.push({ tags: null as never });
    queueResults({ count: 1 }, { data: [tagged] });
    const [item] = (await getDevLogs()).items;

    expect(item).toEqual({
      id: "1",
      title: "제목 1",
      content: "본문 1",
      thumbnailUrl: null,
      githubUrl: "https://github.com/me/repo",
      tags: [
        { id: "t1", name: "개발" },
        { id: "t2", name: "일상" },
      ],
      createdAt: "2026-11-11T00:00:00Z",
      updatedAt: "2026-11-12T00:00:00Z",
    });
  });

  it("개발 일기가 없으면 목록 쿼리 없이 빈 결과를 돌려준다", async () => {
    queueResults({ count: 0 });
    expect(await getDevLogs()).toEqual({
      items: [],
      total: 0,
      page: 1,
      pageSize: 4,
    });
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("조회에 실패하면 예외를 던진다", async () => {
    queueResults({ count: null, error: { message: "boom" } });
    await expect(getDevLogs()).rejects.toThrow("개발 일기 수 조회");

    queueResults({ count: 3 }, { data: null, error: { message: "boom" } });
    await expect(getDevLogs()).rejects.toThrow("개발 일기 목록 조회");
  });
});

describe("getDevLog", () => {
  it("uuid로 한 건을 조회한다", async () => {
    queueResults({ data: row(UUID) });
    const devLog = await getDevLog(UUID);

    expect(devLog?.id).toBe(UUID);
    expect(queries[0].eq).toHaveBeenCalledWith("id", UUID);
  });

  it("없으면 null이다", async () => {
    queueResults({ data: null });
    expect(await getDevLog("00000000-0000-4000-8000-000000000000")).toBeNull();
  });

  it("uuid 형식이 아니면 DB를 부르지 않고 null이다", async () => {
    expect(await getDevLog("1")).toBeNull();
    expect(await getDevLog("없는-id")).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  it("조회에 실패하면 예외를 던진다", async () => {
    queueResults({ data: null, error: { message: "boom" } });
    await expect(
      getDevLog("223e4567-e89b-12d3-a456-426614174000"),
    ).rejects.toThrow("개발 일기 조회");
  });
});
