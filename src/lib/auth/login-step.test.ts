import { describe, expect, it } from "vitest";
import { toLoginStep, toResendProblem } from "./login-step";

describe("toLoginStep", () => {
  it("완료는 redirect, 코드 필요는 code, 실패는 error로 바꾼다", () => {
    expect(
      toLoginStep({ ok: true, data: { status: "done", redirectTo: "/a" } }),
    ).toEqual({
      type: "redirect",
      to: "/a",
    });
    expect(
      toLoginStep({ ok: true, data: { status: "code_required" } }),
    ).toEqual({
      type: "code",
    });
    expect(
      toLoginStep({ ok: false, error: { code: "forbidden", message: "실패" } }),
    ).toEqual({ type: "error", message: "실패" });
  });
});

describe("toResendProblem", () => {
  it("성공이면 null, 실패면 문구다", () => {
    expect(toResendProblem({ ok: true, data: null })).toBeNull();
    expect(
      toResendProblem({
        ok: false,
        error: { code: "forbidden", message: "제한" },
      }),
    ).toBe("제한");
  });
});
