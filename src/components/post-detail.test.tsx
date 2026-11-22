import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Post } from "@/lib/data";
import { PostDetail } from "./post-detail";

vi.mock("@/components/admin-actions", () => ({
  AdminActions: ({
    kind,
    id,
    editHref,
    showDelete,
  }: Record<string, string | boolean | undefined>) => (
    <div data-testid="admin-actions" data-kind={kind} data-id={id}>
      <a href={String(editHref)}>수정</a>
      {showDelete !== false && <button type="button">삭제</button>}
    </div>
  ),
}));

const basePost: Post = {
  id: "p1",
  slug: "hello-blog",
  title: "첫 번째 글",
  content: "## 소제목\n\n본문 **굵게**\n\n<script>alert(1)</script>",
  thumbnailUrl: null,
  tags: [
    { id: "t1", name: "react" },
    { id: "t2", name: "next" },
  ],
  createdAt: "2026-10-20T03:00:00.000Z",
  updatedAt: "2026-10-20T03:00:00.000Z",
};

/** 기본 게시글에 일부만 덮어써 렌더링한다 */
function renderDetail(
  overrides: Partial<Post> = {},
  props: { isAdmin?: boolean; backHref?: string } = {},
) {
  return render(
    <PostDetail
      post={{ ...basePost, ...overrides }}
      backHref={props.backHref ?? "/"}
      isAdmin={props.isAdmin ?? false}
      editHref="/posts/hello-blog?edit=1"
    />,
  );
}

describe("PostDetail", () => {
  it("제목을 h1로, 본문을 마크다운으로 렌더링한다", () => {
    renderDetail();
    expect(
      screen.getByRole("heading", { level: 1, name: "첫 번째 글" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 2, name: "소제목" }),
    ).toBeTruthy();
  });

  it("본문의 원시 HTML은 요소로 만들지 않는다", () => {
    const { container } = renderDetail();
    expect(container.querySelector("script")).toBeNull();
  });

  it("[목록으로]는 전달받은 주소로 연결된다", () => {
    renderDetail({}, { backHref: "/?tag=react&page=2" });
    expect(
      screen.getByRole("link", { name: "목록으로" }).getAttribute("href"),
    ).toBe("/?tag=react&page=2");
  });

  it("태그 칩은 해당 태그의 메인 목록으로 연결된다", () => {
    renderDetail();
    const link = screen.getByRole("link", { name: "react" });
    expect(link.getAttribute("href")).toBe("/?tag=react");
  });

  it("태그가 없으면 태그 목록을 그리지 않는다", () => {
    renderDetail({ tags: [] });
    expect(screen.queryByRole("list", { name: "태그" })).toBeNull();
  });

  it("수정된 적이 없으면 작성일만 보여 준다", () => {
    renderDetail();
    expect(screen.getByText(/^작성/)).toBeTruthy();
    expect(screen.queryByText(/^수정/)).toBeNull();
  });

  it("수정된 적이 있으면 수정일도 보여 준다", () => {
    renderDetail({ updatedAt: "2026-10-25T03:00:00.000Z" });
    expect(screen.getByText(/^수정/)).toBeTruthy();
  });

  it("방문자 DOM에는 [수정]/[삭제]가 없다", () => {
    renderDetail({}, { isAdmin: false });
    expect(screen.queryByTestId("admin-actions")).toBeNull();
    expect(screen.queryByRole("link", { name: "수정" })).toBeNull();
    expect(screen.queryByRole("button", { name: "삭제" })).toBeNull();
  });

  it("showDelete가 false면 관리자에게도 [삭제]를 그리지 않는다", () => {
    render(
      <PostDetail
        post={basePost}
        backHref="/"
        isAdmin
        editHref="/posts/hello-blog?edit=1"
        showDelete={false}
      />,
    );
    expect(screen.getByRole("link", { name: "수정" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "삭제" })).toBeNull();
  });

  it("관리자에게는 게시글 id로 [수정]/[삭제]를 그린다", () => {
    renderDetail({}, { isAdmin: true });
    const actions = screen.getByTestId("admin-actions");
    expect(actions.getAttribute("data-kind")).toBe("post");
    expect(actions.getAttribute("data-id")).toBe("p1");
    expect(
      screen.getByRole("link", { name: "수정" }).getAttribute("href"),
    ).toBe("/posts/hello-blog?edit=1");
  });
});
