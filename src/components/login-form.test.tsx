import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

/** 아이디·비밀번호를 채우고 제출한다 */
function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("아이디(이메일)"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText("비밀번호"), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: "로그인" }));
}

describe("LoginForm", () => {
  it("빈 제출은 필드별 오류를 보이고 인증을 부르지 않는다", () => {
    const authenticate = vi.fn();
    render(<LoginForm authenticate={authenticate} />);
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));
    expect(screen.getByText("아이디(이메일)를 입력해 주세요")).toBeTruthy();
    expect(screen.getByText("비밀번호를 입력해 주세요")).toBeTruthy();
    expect(authenticate).not.toHaveBeenCalled();
  });

  it("이메일 형식이 틀리면 형식 오류를 보인다", () => {
    render(<LoginForm authenticate={vi.fn()} />);
    fillAndSubmit("admin", "pw");
    expect(
      screen.getByText("올바른 이메일 형식으로 입력해 주세요"),
    ).toBeTruthy();
  });

  it("제출 중에는 버튼이 비활성이고, 실패하면 통일 문구를 보인다", async () => {
    let finish: (ok: boolean) => void = () => {};
    const authenticate = vi.fn(
      () => new Promise<boolean>((resolve) => (finish = resolve)),
    );
    render(<LoginForm authenticate={authenticate} />);
    fillAndSubmit("admin@example.com", "pw");
    const button = await screen.findByRole("button", { name: "로그인" });
    await waitFor(() =>
      expect((button as HTMLButtonElement).disabled).toBe(true),
    );
    finish(false);
    expect(
      await screen.findByText("아이디 또는 비밀번호가 올바르지 않습니다"),
    ).toBeTruthy();
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });

  it("needsLogin이면 안내 문구를 보인다", () => {
    render(<LoginForm needsLogin authenticate={vi.fn()} />);
    expect(screen.getByText("관리자 로그인이 필요합니다")).toBeTruthy();
  });

  it("회원가입·비밀번호 찾기 링크가 없다", () => {
    render(<LoginForm authenticate={vi.fn()} />);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
