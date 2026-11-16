import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditModePlaceholder } from "./edit-mode-placeholder";

describe("EditModePlaceholder", () => {
  it("게시글은 '게시글 수정' 제목을 보여 준다", () => {
    render(
      <EditModePlaceholder kind="post" title="첫 글" cancelHref="/posts/a" />,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "게시글 수정" }),
    ).toBeTruthy();
    expect(screen.getByText(/수정 중: 첫 글/)).toBeTruthy();
  });

  it("개발 일기는 '개발 일기 수정' 제목을 보여 준다", () => {
    render(
      <EditModePlaceholder
        kind="devLog"
        title="일기"
        cancelHref="/dev-logs/d1"
      />,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "개발 일기 수정" }),
    ).toBeTruthy();
  });

  it("[취소]는 전달받은 읽기 모드 주소로 연결된다", () => {
    render(
      <EditModePlaceholder
        kind="post"
        title="첫 글"
        cancelHref="/posts/a?tag=react&page=2"
      />,
    );
    expect(
      screen.getByRole("link", { name: "취소" }).getAttribute("href"),
    ).toBe("/posts/a?tag=react&page=2");
  });

  it("[목록으로]·[수정]·[삭제]는 보이지 않는다", () => {
    render(
      <EditModePlaceholder kind="post" title="첫 글" cancelHref="/posts/a" />,
    );
    expect(screen.queryByRole("link", { name: "목록으로" })).toBeNull();
    expect(screen.queryByRole("link", { name: "수정" })).toBeNull();
    expect(screen.queryByRole("button", { name: "삭제" })).toBeNull();
  });
});
