import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PostListEmpty } from "./post-list-empty";

describe("PostListEmpty", () => {
  it("태그 필터 결과가 없으면 안내와 [전체 보기] 링크를 보여준다", () => {
    render(<PostListEmpty tag="없는태그" />);
    expect(screen.getByText("해당 태그의 글이 없습니다")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "전체 보기" }).getAttribute("href"),
    ).toBe("/");
  });

  it("필터 없이 글이 없으면 별도 문구만 보여준다", () => {
    render(<PostListEmpty />);
    expect(screen.getByText("아직 작성된 글이 없습니다")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
