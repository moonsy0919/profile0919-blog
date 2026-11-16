import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField } from "./form-field";
import { SubmitButton } from "./submit-button";

describe("FormField", () => {
  it("오류가 없으면 aria-invalid와 오류 문구가 없다", () => {
    render(<FormField id="email" label="아이디" />);
    const input = screen.getByLabelText("아이디");
    expect(input.getAttribute("aria-invalid")).toBeNull();
    expect(input.getAttribute("aria-describedby")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("오류가 있으면 aria-invalid·aria-describedby로 문구와 연결한다", () => {
    render(<FormField id="email" label="아이디" error="필수입니다" />);
    const input = screen.getByLabelText("아이디");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toBe("필수입니다");
    expect(input.getAttribute("aria-describedby")).toBe(alert.id);
  });
});

describe("SubmitButton", () => {
  it("제출 중이면 비활성이고 진행 문구를 보여 준다", () => {
    render(
      <SubmitButton submitting pendingLabel="로그인 중...">
        로그인
      </SubmitButton>,
    );
    const button = screen.getByRole("button", { name: "로그인 중..." });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("제출 중이 아니면 활성 상태다", () => {
    render(<SubmitButton submitting={false}>로그인</SubmitButton>);
    const button = screen.getByRole("button", { name: "로그인" });
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });
});
