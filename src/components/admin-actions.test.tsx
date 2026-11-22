import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminActions } from "./admin-actions";

// 삭제 다이얼로그는 서버 액션을 가져오므로 자리 표시로 바꾼다
vi.mock("@/components/delete-button", () => ({
  DeleteButton: () => <button type="button">삭제</button>,
}));

describe("AdminActions", () => {
  it("기본값은 [수정]과 [삭제]를 함께 그린다", () => {
    render(<AdminActions kind="post" id="p1" editHref="/posts/a?edit=1" />);
    expect(
      screen.getByRole("link", { name: "수정" }).getAttribute("href"),
    ).toBe("/posts/a?edit=1");
    expect(screen.getByRole("button", { name: "삭제" })).toBeTruthy();
  });

  it("showDelete가 false면 [수정]만 그린다", () => {
    render(
      <AdminActions
        kind="post"
        id="p1"
        editHref="/posts/a?edit=1"
        showDelete={false}
      />,
    );
    expect(screen.getByRole("link", { name: "수정" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "삭제" })).toBeNull();
  });
});
