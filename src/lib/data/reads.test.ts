import { describe, expect, it, vi } from "vitest";
import {
  PAGE_SIZE,
  getDevLog,
  getDevLogs,
  getPost,
  getPosts,
  getProfile,
  getTagCounts,
  getTags,
  getViewer,
} from "@/lib/data";

/** 모의 쿠키 저장소가 돌려줄 dev-viewer 값 */
let mockCookieValue: string | undefined;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () =>
      mockCookieValue === undefined ? undefined : { value: mockCookieValue },
  }),
}));

describe("getPosts", () => {
  it("한 페이지에 4개씩 최신순으로 돌려준다", async () => {
    const result = await getPosts();
    expect(PAGE_SIZE).toBe(4);
    expect(result.items).toHaveLength(4);
    expect(result.page).toBe(1);
    expect(result.total).toBeGreaterThanOrEqual(10);
    const dates = result.items.map((post) => post.createdAt);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("마지막 페이지는 남은 개수만 돌려준다", async () => {
    const first = await getPosts();
    const lastPage = Math.ceil(first.total / PAGE_SIZE);
    const last = await getPosts({ page: lastPage });
    expect(last.items).toHaveLength(first.total - (lastPage - 1) * PAGE_SIZE);
  });

  it("범위를 벗어난 page는 가장 가까운 페이지로 보정한다", async () => {
    const first = await getPosts();
    const lastPage = Math.ceil(first.total / PAGE_SIZE);
    expect((await getPosts({ page: 999 })).page).toBe(lastPage);
    expect((await getPosts({ page: 0 })).page).toBe(1);
    expect((await getPosts({ page: -3 })).page).toBe(1);
    expect((await getPosts({ page: Number.NaN })).page).toBe(1);
  });

  it("태그를 대소문자 무시로 필터링한다", async () => {
    const result = await getPosts({ tag: "next.js" });
    expect(result.total).toBeGreaterThan(0);
    for (const post of result.items) {
      expect(post.tags.map((t) => t.name.toLowerCase())).toContain("next.js");
    }
  });

  it("없는 태그는 빈 결과를 돌려준다", async () => {
    const result = await getPosts({ tag: "없는태그" });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.page).toBe(1);
  });
});

describe("getPost", () => {
  it("slug로 한 건을 조회한다", async () => {
    const post = await getPost("hello-blog");
    expect(post?.title).toBe("블로그를 시작합니다");
  });

  it("없는 slug는 null이다", async () => {
    expect(await getPost("없는-slug")).toBeNull();
  });
});

describe("getTags / getTagCounts", () => {
  it("태그를 6개 이상 돌려준다", async () => {
    expect((await getTags()).length).toBeGreaterThanOrEqual(6);
  });

  it("전체 글 수와 태그별 개수를 돌려주고 0개 태그는 뺀다", async () => {
    const { total, tags } = await getTagCounts();
    expect(total).toBe((await getPosts()).total);
    for (const { tag, count } of tags) {
      const filtered = await getPosts({ tag: tag.name });
      expect(count).toBe(filtered.total);
      expect(count).toBeGreaterThan(0);
    }
  });
});

describe("getDevLogs / getDevLog", () => {
  it("최신순으로 4개씩 나눠 돌려준다", async () => {
    const result = await getDevLogs();
    expect(result.items).toHaveLength(4);
    expect(result.total).toBeGreaterThanOrEqual(5);
    const dates = result.items.map((devLog) => devLog.createdAt);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("범위를 벗어난 page는 보정한다", async () => {
    expect((await getDevLogs({ page: 99 })).page).toBe(2);
  });

  it("id로 한 건을 조회하고 없으면 null이다", async () => {
    expect((await getDevLog("devlog-01"))?.title).toBe("프로젝트 세팅");
    expect(await getDevLog("없는-id")).toBeNull();
  });
});

describe("getProfile / getViewer", () => {
  it("프로필을 돌려준다", async () => {
    const profile = await getProfile();
    expect(profile.displayName.length).toBeGreaterThan(0);
  });

  it("프로덕션에서는 쿠키를 읽지 않고 항상 방문자다", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mockCookieValue = "admin";
    expect(await getViewer()).toEqual({ isAdmin: false });
    vi.unstubAllEnvs();
  });

  it("개발에서는 dev-viewer 쿠키가 admin일 때만 관리자다", async () => {
    mockCookieValue = undefined;
    expect(await getViewer()).toEqual({ isAdmin: false });
    mockCookieValue = "admin";
    expect(await getViewer()).toEqual({ isAdmin: true });
  });
});
