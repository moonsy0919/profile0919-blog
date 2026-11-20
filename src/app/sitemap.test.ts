import { beforeEach, describe, expect, it, vi } from "vitest";
import { siteConfig } from "@/config/site";
import sitemap from "./sitemap";

const getSitemapPosts = vi.fn();
const getSitemapDevLogs = vi.fn();

vi.mock("@/lib/data/reads-sitemap", () => ({
  getSitemapPosts: () => getSitemapPosts(),
  getSitemapDevLogs: () => getSitemapDevLogs(),
}));

const DEV_LOG_ID = "123e4567-e89b-12d3-a456-426614174000";

describe("sitemap", () => {
  beforeEach(() => {
    getSitemapPosts.mockReset();
    getSitemapDevLogs.mockReset();
    getSitemapDevLogs.mockResolvedValue([]);
  });

  it("메인·개발 일기 목록과 공개 글·개발 일기 상세 URL을 포함한다", async () => {
    getSitemapPosts.mockResolvedValue([
      { slug: "hello-world", updatedAt: "2026-11-11T12:46:29.578Z" },
    ]);
    getSitemapDevLogs.mockResolvedValue([
      { id: DEV_LOG_ID, updatedAt: "2026-11-12T00:00:00Z" },
    ]);
    const entries = await sitemap();
    expect(entries.map((entry) => entry.url)).toEqual([
      siteConfig.url,
      `${siteConfig.url}/dev-logs`,
      `${siteConfig.url}/posts/hello-world`,
      `${siteConfig.url}/dev-logs/${DEV_LOG_ID}`,
    ]);
    expect(entries[2].lastModified).toEqual(
      new Date("2026-11-11T12:46:29.578Z"),
    );
    expect(entries[3].lastModified).toEqual(new Date("2026-11-12T00:00:00Z"));
  });

  it("수정 모드(?edit=1) 변형은 넣지 않는다", async () => {
    getSitemapPosts.mockResolvedValue([
      { slug: "a", updatedAt: "2026-11-11T00:00:00Z" },
    ]);
    getSitemapDevLogs.mockResolvedValue([
      { id: DEV_LOG_ID, updatedAt: "2026-11-11T00:00:00Z" },
    ]);
    const entries = await sitemap();
    expect(entries.some((entry) => entry.url.includes("edit"))).toBe(false);
  });

  it("조회가 모두 실패하면 정적 경로만 돌려준다", async () => {
    const fail = async () => {
      throw new Error("환경 변수 없음");
    };
    getSitemapPosts.mockImplementation(fail);
    getSitemapDevLogs.mockImplementation(fail);
    const entries = await sitemap();
    expect(entries.map((entry) => entry.url)).toEqual([
      siteConfig.url,
      `${siteConfig.url}/dev-logs`,
    ]);
  });

  it("글 조회만 실패해도 개발 일기 상세는 포함한다", async () => {
    getSitemapPosts.mockImplementation(async () => {
      throw new Error("boom");
    });
    getSitemapDevLogs.mockResolvedValue([
      { id: DEV_LOG_ID, updatedAt: "2026-11-12T00:00:00Z" },
    ]);
    const entries = await sitemap();
    expect(entries.map((entry) => entry.url)).toContain(
      `${siteConfig.url}/dev-logs/${DEV_LOG_ID}`,
    );
  });
});
