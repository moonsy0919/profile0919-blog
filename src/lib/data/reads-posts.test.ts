import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPost, getPosts, getTagCounts, getTags } from "./reads-posts";

type Result = { data?: unknown; count?: number | null; error?: unknown };

/** 호출 기록을 남기는 Supabase 쿼리 빌더 대역. await하면 지정한 결과를 돌려준다 */
function makeQuery(result: Result) {
  const query: Record<string, unknown> = {};
  for (const method of [
    "select",
    "eq",
    "ilike",
    "order",
    "limit",
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

const rpc = vi.fn();
const from = vi.fn();
let queries: Query[] = [];

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from, rpc }),
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
    slug: `slug-${id}`,
    title: `제목 ${id}`,
    content: `본문 ${id}`,
    thumbnail_url: null,
    created_at: "2026-11-11T00:00:00Z",
    updated_at: "2026-11-12T00:00:00Z",
    post_tags: tags.map((tag) => ({ tags: tag })),
  };
}

const sixRows = ["1", "2", "3", "4", "5", "6"].map((id) => row(id));

beforeEach(() => {
  from.mockReset();
  rpc.mockReset();
  queries = [];
});

describe("getPosts", () => {
  it("한 페이지에 6개씩 최신순으로 조회하고 전체 개수를 함께 돌려준다", async () => {
    queueResults({ count: 7 }, { data: sixRows });
    const result = await getPosts();

    expect(result).toMatchObject({ total: 7, page: 1, pageSize: 6 });
    expect(result.items).toHaveLength(6);
    const [count, list] = queries;
    expect(count.eq).toHaveBeenCalledWith("published", true);
    expect(list.eq).toHaveBeenCalledWith("published", true);
    expect(list.order).toHaveBeenNthCalledWith(1, "created_at", {
      ascending: false,
    });
    expect(list.order).toHaveBeenNthCalledWith(2, "id", { ascending: false });
    expect(list.range).toHaveBeenCalledWith(0, 5);
  });

  it("2페이지는 6번째 다음부터 조회한다", async () => {
    queueResults({ count: 7 }, { data: [row("7")] });
    const result = await getPosts({ page: 2 });

    expect(queries[1].range).toHaveBeenCalledWith(6, 11);
    expect(result).toMatchObject({ page: 2, total: 7 });
    expect(result.items).toHaveLength(1);
  });

  it("범위를 벗어난 page는 마지막 페이지로 보정해 조회한다", async () => {
    queueResults({ count: 7 }, { data: [row("7")] });
    const result = await getPosts({ page: 999 });

    expect(result.page).toBe(2);
    expect(queries[1].range).toHaveBeenCalledWith(6, 11);
  });

  it("행을 도메인 글로 바꾸고 태그는 이름순이며 비어 있는 태그 연결은 뺀다", async () => {
    const tagged = row("1", [
      { id: "t2", name: "일상" },
      { id: "t1", name: "개발" },
    ]);
    tagged.post_tags.push({ tags: null as never });
    queueResults({ count: 1 }, { data: [tagged] });
    const [post] = (await getPosts()).items;

    expect(post).toEqual({
      id: "1",
      slug: "slug-1",
      title: "제목 1",
      content: "본문 1",
      thumbnailUrl: null,
      tags: [
        { id: "t1", name: "개발" },
        { id: "t2", name: "일상" },
      ],
      createdAt: "2026-11-11T00:00:00Z",
      updatedAt: "2026-11-12T00:00:00Z",
    });
  });

  it("태그를 대소문자 무시로 찾아 그 태그가 붙은 글만 조회한다", async () => {
    queueResults({ data: [{ id: "t1" }] }, { count: 1 }, { data: [row("1")] });
    const result = await getPosts({ tag: "next.js" });

    const [tagLookup, count, list] = queries;
    expect(tagLookup.ilike).toHaveBeenCalledWith("name", "next.js");
    expect(count.eq).toHaveBeenCalledWith("post_tags.tag_id", "t1");
    expect(list.eq).toHaveBeenCalledWith("filter.tag_id", "t1");
    expect(result.total).toBe(1);
  });

  it("태그 이름의 LIKE 특수문자(%, _, \\)는 이스케이프해서 비교한다", async () => {
    queueResults({ data: [] });
    await getPosts({ tag: "100%_a\\" });

    expect(queries[0].ilike).toHaveBeenCalledWith("name", "100\\%\\_a\\\\");
  });

  it("없는 태그는 글 조회 없이 빈 결과를 돌려준다", async () => {
    queueResults({ data: [] });
    const result = await getPosts({ tag: "없는태그", page: 3 });

    expect(result).toEqual({ items: [], total: 0, page: 1, pageSize: 6 });
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("공개 글이 하나도 없으면 목록 조회 없이 빈 결과다", async () => {
    queueResults({ count: 0 });
    const result = await getPosts();

    expect(result).toEqual({ items: [], total: 0, page: 1, pageSize: 6 });
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("조회가 실패하면 빈 목록으로 숨기지 않고 예외를 던진다", async () => {
    queueResults({ count: null, error: { message: "boom" } });
    await expect(getPosts()).rejects.toThrow("게시글 수 조회에 실패했습니다");

    queueResults({ count: 7 }, { error: { message: "boom" } });
    await expect(getPosts()).rejects.toThrow("게시글 목록 조회에 실패했습니다");

    queueResults({ data: null, error: { message: "boom" } });
    await expect(getPosts({ tag: "a" })).rejects.toThrow(
      "태그 조회에 실패했습니다",
    );
  });
});

describe("getPost", () => {
  it("slug로 공개 글 한 건을 태그와 함께 조회한다", async () => {
    queueResults({ data: row("1", [{ id: "t1", name: "개발" }]) });
    const post = await getPost("slug-1");

    expect(post).toMatchObject({
      id: "1",
      slug: "slug-1",
      tags: [{ id: "t1", name: "개발" }],
    });
    expect(queries[0].eq).toHaveBeenCalledWith("published", true);
    expect(queries[0].eq).toHaveBeenCalledWith("slug", "slug-1");
  });

  it("없는 slug는 null이다", async () => {
    queueResults({ data: null });
    expect(await getPost("없는-slug")).toBeNull();
  });

  it("조회가 실패하면 null이 아니라 예외를 던진다", async () => {
    queueResults({ data: null, error: { message: "boom" } });
    await expect(getPost("slug-1")).rejects.toThrow(
      "게시글 조회에 실패했습니다",
    );
  });
});

describe("getTags", () => {
  it("태그를 이름순으로 조회한다", async () => {
    const tags = [
      { id: "t1", name: "개발" },
      { id: "t2", name: "일상" },
    ];
    queueResults({ data: tags });

    expect(await getTags()).toEqual(tags);
    expect(queries[0].order).toHaveBeenCalledWith("name", { ascending: true });
  });

  it("조회가 실패하면 예외를 던진다", async () => {
    queueResults({ data: null, error: { message: "boom" } });
    await expect(getTags()).rejects.toThrow("태그 목록 조회에 실패했습니다");
  });
});

describe("getTagCounts", () => {
  it("get_post_tag_counts 결과와 공개 글 전체 수를 돌려준다", async () => {
    rpc.mockResolvedValue({
      data: [
        { tag_id: "t1", tag_name: "개발", post_count: 6 },
        { tag_id: "t2", tag_name: "일상", post_count: "2" },
      ],
      error: null,
    });
    queueResults({ count: 7 });

    expect(await getTagCounts()).toEqual({
      total: 7,
      tags: [
        { tag: { id: "t1", name: "개발" }, count: 6 },
        { tag: { id: "t2", name: "일상" }, count: 2 },
      ],
    });
    expect(rpc).toHaveBeenCalledWith("get_post_tag_counts");
    expect(queries[0].eq).toHaveBeenCalledWith("published", true);
  });

  it("태그 개수 조회가 실패하면 예외를 던진다", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    queueResults({ count: 7 });
    await expect(getTagCounts()).rejects.toThrow(
      "태그 개수 조회에 실패했습니다",
    );
  });
});
