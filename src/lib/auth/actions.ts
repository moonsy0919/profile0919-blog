"use server";

import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/data/types";
import { createClient } from "@/lib/supabase/server";
import {
  runLogin,
  runResendCode,
  runVerifyCode,
  unavailable,
  type LoginOutcome,
} from "./login-flow";

/*
 * 인증 서버 액션. data 계층(더미 → 실데이터 교체 대상)과 분리해 이 폴더에 둔다.
 * 실제 처리는 login-flow.ts가 하고, 여기서는 예외(서비스 키 누락·DB 오류 등)를 사용자용 실패 결과로 바꾼다.
 * 예외 대신 ActionResult를 돌려주는 규약은 data/actions.ts와 같다.
 * 'use server' 파일은 async 함수만 export할 수 있으므로 헬퍼는 export하지 않는다.
 */

/** 처리 중 던져진 오류를 기록하고 "지금은 로그인을 처리할 수 없습니다" 결과로 바꾼다 */
async function guarded<T>(work: () => Promise<ActionResult<T>>) {
  try {
    return await work();
  } catch (error) {
    console.error("[auth] 로그인 처리 중 오류", error);
    return unavailable();
  }
}

/**
 * 관리자 로그인(1단계). 차단된 IP는 로직 없이 차단 안내만 돌려주고, 신뢰 IP는 즉시 로그인하며,
 * 새 IP는 이메일 인증 코드 단계(code_required)로 넘긴다. 모든 실패는 통일 문구다.
 * @param values 로그인 폼 입력값(서버에서 다시 검증한다)
 * @param next 로그인 후 돌아갈 경로(내부 경로만 허용)
 */
export async function login(
  values: { email: string; password: string },
  next?: string,
): Promise<ActionResult<LoginOutcome>> {
  return guarded(() => runLogin(values, next));
}

/**
 * 관리자 로그인(2단계). 이메일로 받은 인증 코드를 확인하고 로그인을 마무리한다.
 * @param code 인증 코드
 * @param next 로그인 후 돌아갈 경로(내부 경로만 허용)
 */
export async function verifyLoginCode(
  code: string,
  next?: string,
): Promise<ActionResult<LoginOutcome>> {
  return guarded(() => runVerifyCode(code, next));
}

/** 인증 코드를 다시 보낸다 */
export async function resendLoginCode(): Promise<ActionResult<null>> {
  return guarded(() => runResendCode());
}

/** 코드 입력 단계에서 취소한다. 승인 전 세션을 로그아웃하고 로그인 화면에 머문다 */
export async function cancelLoginCode(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

/** 로그아웃 후 메인(/)으로 이동한다. 승인된 세션 기록은 세션 삭제와 함께 지워진다 */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
