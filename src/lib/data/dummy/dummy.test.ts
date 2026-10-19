import { describe, expect, it } from "vitest";
import { dummyDevLogs } from "./devLogs";
import { dummyPosts } from "./posts";
import { dummyTags } from "./tags";

describe("더미 데이터 무결성", () => {
  it("요구 개수를 만족한다", () => {
    expect(dummyTags.length).toBeGreaterThanOrEqual(6);
    expect(dummyPosts.length).toBeGreaterThanOrEqual(10);
    expect(dummyDevLogs.length).toBeGreaterThanOrEqual(5);
  });

  it("글 slug와 id가 유일하다", () => {
    expect(new Set(dummyPosts.map((p) => p.slug)).size).toBe(dummyPosts.length);
    expect(new Set(dummyPosts.map((p) => p.id)).size).toBe(dummyPosts.length);
  });

  it("slug는 형식을 지키고 예약어 new가 아니다", () => {
    for (const post of dummyPosts) {
      expect(post.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(post.slug).not.toBe("new");
    }
  });

  it("모든 글·일기의 태그가 태그 목록에 있다", () => {
    const tagIds = new Set(dummyTags.map((t) => t.id));
    for (const item of [...dummyPosts, ...dummyDevLogs]) {
      for (const tag of item.tags) expect(tagIds.has(tag.id)).toBe(true);
    }
  });

  it("썸네일·GitHub 링크가 있는 것과 없는 것이 섞여 있다", () => {
    expect(dummyPosts.some((p) => p.thumbnailUrl)).toBe(true);
    expect(dummyPosts.some((p) => !p.thumbnailUrl)).toBe(true);
    expect(dummyDevLogs.some((d) => d.githubUrl)).toBe(true);
    expect(dummyDevLogs.some((d) => !d.githubUrl)).toBe(true);
  });

  it("GitHub 링크는 https://github.com/ 로 시작한다", () => {
    for (const devLog of dummyDevLogs) {
      if (devLog.githubUrl) {
        expect(devLog.githubUrl.startsWith("https://github.com/")).toBe(true);
      }
    }
  });

  it("글 생성일이 서로 달라 정렬이 결정적이다", () => {
    expect(new Set(dummyPosts.map((p) => p.createdAt)).size).toBe(
      dummyPosts.length,
    );
  });
});
