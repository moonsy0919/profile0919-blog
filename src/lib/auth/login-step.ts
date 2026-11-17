import type { ActionResult } from "@/lib/data/types";
import type { LoginOutcome } from "./login-flow";

/** 로그인 폼이 다음에 할 일: 이동, 코드 입력 단계로 전환, 오류 문구 표시 */
export type LoginStep =
  | { type: "redirect"; to: string }
  | { type: "code" }
  | { type: "error"; message: string };

/**
 * 서버 액션 결과를 폼이 쓰기 쉬운 형태로 바꾼다.
 * @param result login·verifyLoginCode 액션의 결과
 */
export function toLoginStep(result: ActionResult<LoginOutcome>): LoginStep {
  if (!result.ok) return { type: "error", message: result.error.message };
  if (result.data.status === "code_required") return { type: "code" };
  return { type: "redirect", to: result.data.redirectTo };
}

/**
 * 코드 재발송 결과를 문구로 바꾼다.
 * @param result resendLoginCode 액션의 결과
 * @returns 성공이면 null, 실패하면 보여 줄 문구
 */
export function toResendProblem(result: ActionResult<null>): string | null {
  return result.ok ? null : result.error.message;
}
