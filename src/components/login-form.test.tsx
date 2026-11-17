import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { LoginStep } from "@/lib/auth/login-step";
import { LoginForm } from "./login-form";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

// 서버 액션 모듈은 서버 전용 코드를 끌고 오므로 폼 테스트에서는 비워 둔다(기본값은 prop으로 교체한다).
vi.mock("@/lib/auth/actions", () => ({
  login: vi.fn(),
  verifyLoginCode: vi.fn(),
  resendLoginCode: vi.fn(),
  cancelLoginCode: vi.fn(),
}));

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

  it("제출 중에는 버튼이 비활성이고, 실패하면 서버가 준 문구를 보인다", async () => {
    let finish: (step: LoginStep) => void = () => {};
    const authenticate = vi.fn(
      () => new Promise<LoginStep>((resolve) => (finish = resolve)),
    );
    render(<LoginForm authenticate={authenticate} />);
    fillAndSubmit("admin@example.com", "pw");
    const button = await screen.findByRole("button", { name: "로그인" });
    await waitFor(() =>
      expect((button as HTMLButtonElement).disabled).toBe(true),
    );
    finish({
      type: "error",
      message: "아이디 또는 비밀번호가 올바르지 않습니다",
    });
    expect(
      await screen.findByText("아이디 또는 비밀번호가 올바르지 않습니다"),
    ).toBeTruthy();
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });

  it("차단 안내도 서버가 준 문구 그대로 보인다", async () => {
    const authenticate = vi.fn().mockResolvedValue({
      type: "error",
      message: "이 IP에서의 로그인이 차단되었습니다. 관리자에게 문의해 주세요",
    });
    render(<LoginForm authenticate={authenticate} />);
    fillAndSubmit("admin@example.com", "pw");
    expect(await screen.findByText(/차단되었습니다/)).toBeTruthy();
  });

  it("성공하면 next 경로로 이동하고 서버 데이터를 새로 읽는다", async () => {
    const authenticate = vi
      .fn()
      .mockResolvedValue({ type: "redirect", to: "/posts/a?edit=1" });
    render(<LoginForm next="/posts/a?edit=1" authenticate={authenticate} />);
    fillAndSubmit("admin@example.com", "pw");
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/posts/a?edit=1"),
    );
    expect(refresh).toHaveBeenCalled();
    expect(authenticate).toHaveBeenCalledWith(
      { email: "admin@example.com", password: "pw" },
      "/posts/a?edit=1",
    );
  });

  it("새 IP면 인증 코드 입력 단계로 바뀐다", async () => {
    const authenticate = vi.fn().mockResolvedValue({ type: "code" });
    render(<LoginForm authenticate={authenticate} />);
    fillAndSubmit("admin@example.com", "pw");
    expect(await screen.findByLabelText("인증 코드")).toBeTruthy();
    expect(screen.queryByLabelText("비밀번호")).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it("코드 단계에서 [취소]하면 세션을 정리하고 처음 화면으로 돌아간다", async () => {
    const cancelCode = vi.fn().mockResolvedValue(undefined);
    const authenticate = vi.fn().mockResolvedValue({ type: "code" });
    render(<LoginForm authenticate={authenticate} cancelCode={cancelCode} />);
    fillAndSubmit("admin@example.com", "pw");
    fireEvent.click(await screen.findByRole("button", { name: "취소" }));
    expect(await screen.findByLabelText("비밀번호")).toBeTruthy();
    expect(cancelCode).toHaveBeenCalledTimes(1);
  });

  it("코드를 맞게 입력하면 next로 이동한다", async () => {
    const authenticate = vi.fn().mockResolvedValue({ type: "code" });
    const verifyCode = vi.fn().mockResolvedValue({ type: "redirect", to: "/" });
    render(<LoginForm authenticate={authenticate} verifyCode={verifyCode} />);
    fillAndSubmit("admin@example.com", "pw");
    fireEvent.change(await screen.findByLabelText("인증 코드"), {
      target: { value: "12345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: "확인" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(verifyCode).toHaveBeenCalledWith("12345678", undefined);
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
