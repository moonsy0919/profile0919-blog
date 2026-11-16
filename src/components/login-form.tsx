"use client";

import { type FormEvent, useState } from "react";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { zodErrorToFieldErrors } from "@/lib/validation/errors";
import { type LoginFormValues, loginFormSchema } from "@/lib/validation/login";

/** 로그인 실패 문구. 계정 존재 여부가 드러나지 않도록 한 가지로 통일한다 (PRD 4.5) */
const LOGIN_FAILED_MESSAGE = "아이디 또는 비밀번호가 올바르지 않습니다";

/** 폼 상태: 대기 / 제출 중 / 로그인 실패 */
type LoginStatus = "idle" | "submitting" | "error";

type LoginFormProps = {
  /** 관리자 전용 페이지에서 넘어왔으면 true — 안내 문구를 보인다 */
  needsLogin?: boolean;
  /** 인증 호출. 성공 여부를 돌려준다 (기본값은 항상 실패하는 더미, Task 016에서 교체) */
  authenticate?: (values: LoginFormValues) => Promise<boolean>;
};

/**
 * 더미 인증. 실제 인증(Supabase)이 연결되기 전까지 항상 실패를 돌려준다.
 */
async function dummyAuthenticate() {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return false;
}

/**
 * 관리자 로그인 폼. 제출 시 Zod로 검증해 필드 오류를 보이고, 통과하면 인증을 호출한다.
 * 성공 후 이동·세션 처리는 Task 016에서 연결한다.
 * @param needsLogin 관리자 로그인 필요 안내를 보일지 여부
 * @param authenticate 인증 호출 (테스트·실연결용으로 교체 가능)
 */
export function LoginForm({
  needsLogin = false,
  authenticate = dummyAuthenticate,
}: LoginFormProps) {
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /** 검증 → 인증 순으로 처리한다 */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = loginFormSchema.safeParse({
      email: form.get("email") ?? "",
      password: form.get("password") ?? "",
    });
    if (!parsed.success) {
      setFieldErrors(zodErrorToFieldErrors(parsed.error));
      setStatus("idle");
      return;
    }
    setFieldErrors({});
    setStatus("submitting");
    const ok = await authenticate(parsed.data);
    setStatus(ok ? "idle" : "error");
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={status === "submitting"}
      className="flex flex-col gap-4"
    >
      {needsLogin ? (
        <p className="text-sm text-muted-foreground">
          관리자 로그인이 필요합니다
        </p>
      ) : null}
      <FormField
        id="login-email"
        name="email"
        type="email"
        label="아이디(이메일)"
        autoComplete="username"
        error={fieldErrors.email}
      />
      <FormField
        id="login-password"
        name="password"
        type="password"
        label="비밀번호"
        autoComplete="current-password"
        error={fieldErrors.password}
      />
      {status === "error" ? (
        <p role="alert" className="text-sm text-destructive">
          {LOGIN_FAILED_MESSAGE}
        </p>
      ) : null}
      <SubmitButton submitting={status === "submitting"} size="lg">
        로그인
      </SubmitButton>
    </form>
  );
}
