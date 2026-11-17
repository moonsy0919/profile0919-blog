"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { LoginCodeForm } from "@/components/login-code-form";
import {
  cancelLoginCode,
  login,
  resendLoginCode,
  verifyLoginCode,
} from "@/lib/auth/actions";
import { LOGIN_FAILED_MESSAGE } from "@/lib/auth/constants";
import {
  type LoginStep,
  toLoginStep,
  toResendProblem,
} from "@/lib/auth/login-step";
import { zodErrorToFieldErrors } from "@/lib/validation/errors";
import { type LoginFormValues, loginFormSchema } from "@/lib/validation/login";

/** 폼 상태: 대기 / 제출 중 / 로그인 실패 */
type LoginStatus = "idle" | "submitting" | "error";

type LoginFormProps = {
  /** 관리자 전용 페이지에서 넘어왔으면 true — 안내 문구를 보인다 */
  needsLogin?: boolean;
  /** 로그인 후 돌아갈 경로(쿼리의 next). 서버 액션이 내부 경로인지 다시 검증한다 */
  next?: string;
  /** 1단계 인증 호출 (기본값은 login 서버 액션) */
  authenticate?: (values: LoginFormValues, next?: string) => Promise<LoginStep>;
  /** 2단계 코드 검증 호출 (기본값은 verifyLoginCode 서버 액션) */
  verifyCode?: (code: string, next?: string) => Promise<LoginStep>;
  /** 코드 재발송 호출. 성공하면 null, 실패하면 문구 (기본값은 resendLoginCode 서버 액션) */
  resendCode?: () => Promise<string | null>;
  /** 코드 단계 취소 시 승인 전 세션을 정리하는 호출 (기본값은 cancelLoginCode 서버 액션) */
  cancelCode?: () => Promise<void>;
};

/** login 서버 액션을 호출해 폼이 쓰기 쉬운 결과로 바꾼다 */
async function authenticateWithServer(values: LoginFormValues, next?: string) {
  return toLoginStep(await login(values, next));
}

/** verifyLoginCode 서버 액션을 호출한다 */
async function verifyWithServer(code: string, next?: string) {
  return toLoginStep(await verifyLoginCode(code, next));
}

/** resendLoginCode 서버 액션을 호출한다 */
async function resendWithServer() {
  return toResendProblem(await resendLoginCode());
}

/**
 * 관리자 로그인 폼. 제출 시 Zod로 검증해 필드 오류를 보이고, 통과하면 인증을 호출한다.
 * 신뢰 IP면 바로 next로 이동하고, 새 IP면 이메일 인증 코드 입력 단계로 바뀐다.
 * 실패는 계정 존재 여부가 드러나지 않게 서버가 돌려준 문구(기본은 한 가지 통일 문구)를 보인다.
 * @param needsLogin 관리자 로그인 필요 안내를 보일지 여부
 * @param next 로그인 후 돌아갈 경로
 * @param authenticate 1단계 인증 호출 (테스트용으로 교체 가능)
 * @param verifyCode 2단계 코드 검증 호출
 * @param resendCode 코드 재발송 호출
 * @param cancelCode 코드 단계 취소 호출
 */
export function LoginForm({
  needsLogin = false,
  next,
  authenticate = authenticateWithServer,
  verifyCode = verifyWithServer,
  resendCode = resendWithServer,
  cancelCode = cancelLoginCode,
}: LoginFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "code">("credentials");
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [message, setMessage] = useState(LOGIN_FAILED_MESSAGE);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /** 로그인이 끝나면 이동하고 서버 데이터를 새로 읽는다 */
  function finish(to: string) {
    router.replace(to as Route);
    router.refresh();
  }

  /** 코드 단계를 취소하고 승인 전 세션을 정리한 뒤 처음 화면으로 돌아간다 */
  async function handleCancel() {
    await cancelCode();
    setStatus("idle");
    setStep("credentials");
  }

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
    const result = await authenticate(parsed.data, next);
    if (result.type === "redirect") return finish(result.to);
    if (result.type === "code") {
      setStatus("idle");
      return setStep("code");
    }
    setMessage(result.message);
    setStatus("error");
  }

  if (step === "code") {
    return (
      <LoginCodeForm
        next={next}
        verifyCode={verifyCode}
        resendCode={resendCode}
        onDone={finish}
        onCancel={handleCancel}
      />
    );
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
          {message}
        </p>
      ) : null}
      <SubmitButton submitting={status === "submitting"} size="lg">
        로그인
      </SubmitButton>
    </form>
  );
}
