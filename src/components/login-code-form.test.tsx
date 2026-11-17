import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginCodeForm } from "./login-code-form";

/** 코드를 입력하고 [확인]을 누른다 */
function submitCode(value: string) {
  fireEvent.change(screen.getByLabelText("인증 코드"), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "확인" }));
}

/** 기본 props로 렌더링한다 */
function setup(overrides: Partial<Parameters<typeof LoginCodeForm>[0]> = {}) {
  const props = {
    verifyCode: vi.fn(),
    resendCode: vi.fn().mockResolvedValue(null),
    onDone: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  render(<LoginCodeForm {...props} />);
  return props;
}

describe("LoginCodeForm", () => {
  it("8자리 숫자가 아니면 서버를 부르지 않고 형식 오류를 보인다", () => {
    const { verifyCode } = setup();
    submitCode("1234");
    expect(screen.getByText("8자리 숫자를 입력해 주세요")).toBeTruthy();
    expect(verifyCode).not.toHaveBeenCalled();
  });

  it("맞는 코드는 이동 경로로 onDone을 부른다", async () => {
    const verifyCode = vi
      .fn()
      .mockResolvedValue({ type: "redirect", to: "/x" });
    const { onDone } = setup({ verifyCode, next: "/x" });
    submitCode("12345678");
    await waitFor(() => expect(onDone).toHaveBeenCalledWith("/x"));
    expect(verifyCode).toHaveBeenCalledWith("12345678", "/x");
  });

  it("틀린 코드는 서버가 준 문구를 보인다", async () => {
    const verifyCode = vi
      .fn()
      .mockResolvedValue({
        type: "error",
        message: "인증 코드가 올바르지 않습니다",
      });
    setup({ verifyCode });
    submitCode("12345678");
    expect(
      await screen.findByText("인증 코드가 올바르지 않습니다"),
    ).toBeTruthy();
  });

  it("[코드 다시 받기]는 재발송을 부르고 안내를 보인다", async () => {
    const { resendCode } = setup();
    fireEvent.click(screen.getByRole("button", { name: "코드 다시 받기" }));
    expect(await screen.findByText("인증 코드를 다시 보냈습니다")).toBeTruthy();
    expect(resendCode).toHaveBeenCalledTimes(1);
  });

  it("재발송이 제한되면 그 문구를 보인다", async () => {
    setup({
      resendCode: vi.fn().mockResolvedValue("잠시 후 다시 시도해 주세요"),
    });
    fireEvent.click(screen.getByRole("button", { name: "코드 다시 받기" }));
    expect(await screen.findByText("잠시 후 다시 시도해 주세요")).toBeTruthy();
  });

  it("[취소]는 onCancel을 부른다", () => {
    const { onCancel } = setup();
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
