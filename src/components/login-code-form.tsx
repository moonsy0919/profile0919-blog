"use client";

import { type FormEvent, useState } from "react";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { CODE_LENGTH } from "@/lib/auth/constants";
import type { LoginStep } from "@/lib/auth/login-step";

type LoginCodeFormProps = {
  /** 로그인 후 돌아갈 경로 */
  next?: string;
  /** 코드 검증 호출 */
  verifyCode: (code: string, next?: string) => Promise<LoginStep>;
  /** 코드 재발송 호출. 성공하면 null, 실패하면 문구를 돌려준다 */
  resendCode: () => Promise<string | null>;
  /** 로그인이 끝났을 때(이동 경로 전달) */
  onDone: (to: string) => void;
  /** 취소했을 때(승인 전 세션 정리 후 처음 화면으로) */
  onCancel: () => void;
};

/** 폼 상태: 대기 / 제출 중 / 오류 */
type CodeStatus = "idle" | "submitting" | "error";

const CODE_PATTERN = new RegExp(`^\\d{${CODE_LENGTH}}$`);

/**
 * 새 IP 로그인의 2단계: 이메일로 받은 인증 코드를 입력한다.
 * 형식이 틀리면 서버를 부르지 않고, 틀린 코드·만료는 서버가 돌려준 문구를 그대로 보여 준다.
 * @param next 로그인 후 돌아갈 경로
 * @param verifyCode 코드 검증 호출
 * @param resendCode 코드 재발송 호출
 * @param onDone 로그인 완료 콜백
 * @param onCancel 취소 콜백
 */
export function LoginCodeForm({
  next,
  verifyCode,
  resendCode,
  onDone,
  onCancel,
}: LoginCodeFormProps) {
  const [status, setStatus] = useState<CodeStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  /** 코드 형식을 확인한 뒤 서버에 검증을 요청한다 */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(
      new FormData(event.currentTarget).get("code") ?? "",
    ).trim();
    setNotice(null);
    if (!CODE_PATTERN.test(code)) {
      setMessage(`${CODE_LENGTH}자리 숫자를 입력해 주세요`);
      setStatus("idle");
      return;
    }
    setMessage(null);
    setStatus("submitting");
    const step = await verifyCode(code, next);
    if (step.type === "redirect") return onDone(step.to);
    setStatus("error");
    setMessage(step.type === "error" ? step.message : null);
  }

  /** 코드를 다시 받는다 */
  async function handleResend() {
    const problem = await resendCode();
    setStatus(problem ? "error" : "idle");
    setMessage(problem);
    setNotice(problem ? null : "인증 코드를 다시 보냈습니다");
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={status === "submitting"}
      className="flex flex-col gap-4"
    >
      <p className="text-sm text-muted-foreground">
        새로운 IP에서의 로그인입니다. 이메일로 보낸 {CODE_LENGTH}자리 인증
        코드를 입력해 주세요
      </p>
      <FormField
        id="login-code"
        name="code"
        label="인증 코드"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        error={message ?? undefined}
      />
      {notice ? (
        <p className="text-sm text-muted-foreground">{notice}</p>
      ) : null}
      <SubmitButton submitting={status === "submitting"} size="lg">
        확인
      </SubmitButton>
      <div className="flex justify-between">
        <Button type="button" variant="ghost" size="sm" onClick={handleResend}>
          코드 다시 받기
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          취소
        </Button>
      </div>
    </form>
  );
}
