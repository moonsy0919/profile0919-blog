import { beforeEach, describe, expect, it, vi } from "vitest";
import { siteConfig } from "@/config/site";
import sitemap from "./sitemap";

const getSitemapPosts = vi.fn();

vi.mock("@/lib/data/reads-sitemap", () => ({
  getSitemapPosts: () => getSitemapPosts(),
}));

describe("sitemap", () => {
  beforeEach(() => {
    getSitemapPosts.mockReset();
  });

  it("메인과 공개 글 상세 URL을 포함한다", async () => {
    getSitemapPosts.mockResolvedValue([
      { slug: "hello-world", updatedAt: "2026-11-11T12:46:29.578Z" },
    ]);
    const entries = await sitemap();
    expect(entries.map((entry) => entry.url)).toEqual([
      siteConfig.url,
      `${siteConfig.url}/posts/hello-world`,
    ]);
    expect(entries[1].lastModified).toEqual(
      new Date("2026-11-11T12:46:29.578Z"),
    );
  });

  it("수정 모드(?edit=1) 변형은 넣지 않는다", async () => {
    getSitemapPosts.mockResolvedValue([
      { slug: "a", updatedAt: "2026-11-11T00:00:00Z" },
    ]);
    const entries = await sitemap();
    expect(entries.some((entry) => entry.url.includes("edit"))).toBe(false);
  });

  it("조회가 실패하면 정적 경로만 돌려준다", async () => {
    getSitemapPosts.mockImplementation(async () => {
      throw new Error("환경 변수 없음");
    });
    const entries = await sitemap();
    expect(entries.map((entry) => entry.url)).toEqual([siteConfig.url]);
  });
});
