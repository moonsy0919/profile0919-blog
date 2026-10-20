import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Post } from "@/lib/data";
import { PostCard } from "./post-card";

const basePost: Post = {
  id: "p1",
  slug: "hello-blog",
  title: "첫 번째 글",
  content: "# 제목\n\n본문 **강조** 내용입니다.",
  thumbnailUrl: "/uploads/thumb.png",
  tags: [{ id: "t1", name: "react" }],
  createdAt: "2026-10-20T03:00:00.000Z",
  updatedAt: "2026-10-20T03:00:00.000Z",
};

/** 기본 게시글에 일부만 덮어써 렌더링한다 */
function renderCard(
  props: { tag?: string; page?: number } = {},
  overrides: Partial<Post> = {},
) {
  return render(<PostCard post={{ ...basePost, ...overrides }} {...props} />);
}

describe("PostCard", () => {
  it("기본 목록 상태에서는 쿼리 없이 상세로 링크한다", () => {
    renderCard();
    expect(screen.getByRole("link").getAttribute("href")).toBe(
      "/posts/hello-blog",
    );
  });

  it("tag와 page를 쿼리로 전달한다", () => {
    renderCard({ tag: "react", page: 2 });
    expect(screen.getByRole("link").getAttribute("href")).toBe(
      "/posts/hello-blog?tag=react&page=2",
    );
  });

  it("1페이지는 page 쿼리를 생략한다", () => {
    renderCard({ tag: "react", page: 1 });
    expect(screen.getByRole("link").getAttribute("href")).toBe(
      "/posts/hello-blog?tag=react",
    );
  });

  it("제목과 마크다운 기호를 지운 요약을 보여준다", () => {
    renderCard();
    expect(screen.getByText("첫 번째 글")).toBeTruthy();
    const summary = screen.getByText(/본문 강조 내용입니다/);
    expect(summary.className).toContain("line-clamp-3");
    expect(summary.textContent).not.toContain("**");
  });

  it("날짜를 서울 기준 ko-KR 형식으로 보여준다", () => {
    renderCard();
    const time = document.querySelector("time");
    expect(time?.getAttribute("datetime")).toBe(basePost.createdAt);
    expect(time?.textContent).toBe("2026. 10. 20.");
  });

  it("썸네일 주소가 있으면 그대로 쓴다", () => {
    const { container } = renderCard();
    expect(container.querySelector("img")?.getAttribute("src")).toContain(
      "/uploads/thumb.png",
    );
  });

  it("썸네일이 없으면 기본 이미지를 쓴다", () => {
    const { container } = renderCard({}, { thumbnailUrl: null });
    expect(container.querySelector("img")?.getAttribute("src")).toContain(
      "/default-thumbnail.svg",
    );
  });

  it("썸네일을 불러오지 못하면 기본 이미지로 바꾼다", () => {
    const { container } = renderCard();
    const img = container.querySelector("img") as HTMLImageElement;
    fireEvent.error(img);
    expect(container.querySelector("img")?.getAttribute("src")).toContain(
      "/default-thumbnail.svg",
    );
  });
});
