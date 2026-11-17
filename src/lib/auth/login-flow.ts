import { profileConfig } from "@/config/profile";
import type { ActionResult } from "@/lib/data/types";
import { createAdminClient, type AdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loginFormSchema } from "@/lib/validation/login";
import { isAllowlistedAdmin } from "./admins";
import { buildCodeMail } from "./auth-mails";
import { issueChallenge, verifyChallenge } from "./challenge";
import { getClientIp } from "./client-ip";
import {
  CODE_EXPIRED_MESSAGE,
  CODE_LENGTH,
  CODE_MISMATCH_MESSAGE,
  CODE_RESEND_LIMITED_MESSAGE,
  LOGIN_BLOCKED_MESSAGE,
  LOGIN_FAILED_MESSAGE,
  LOGIN_UNAVAILABLE_MESSAGE,
  VERIFIED_SESSION_DAYS,
} from "./constants";
import {
  isIpBlocked,
  registerLoginFailure,
  resetLoginFailures,
} from "./ip-attempts";
import { sendMail } from "./mailer";
import { notifyBlocked, notifyNewTrustedIp } from "./notify";
import { sanitizeNext } from "./safe-next";
import { addTrustedIp, isTrustedIp } from "./trusted-ip";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

/** 한 번의 로그인 요청이 공유하는 의존성 */
type Ctx = { admin: AdminClient; supabase: ServerSupabase; ip: string };

/** 로그인 처리 결과: 끝났거나(done), 이메일 인증 코드가 필요하다(code_required) */
export type LoginOutcome =
  { status: "done"; redirectTo: string } | { status: "code_required" };

/** 현재 로그인 세션에서 읽은 값 */
type SessionInfo = { userId: string; sessionId: string; email: string };

const CODE_PATTERN = new RegExp(`^\\d{${CODE_LENGTH}}$`);

/** 실패 결과를 만든다 */
function failure(message: string, code: "forbidden" | "unknown" = "forbidden") {
  return { ok: false, error: { code, message } } as const;
}

/** 서비스 키·Supabase 클라이언트·방문자 IP를 한 번에 준비한다 */
export async function createContext(): Promise<Ctx> {
  const [supabase, ip] = await Promise.all([createClient(), getClientIp()]);
  return { admin: createAdminClient(), supabase, ip };
}

/**
 * 연속 실패를 기록하고 실패 결과를 돌려준다. 이번 실패로 차단되면 차단 안내를, 새 차단이면 관리자에게 알림 메일을 보낸다.
 * @param ctx 요청 컨텍스트
 * @param message 차단되지 않았을 때 보여 줄 실패 문구
 */
async function failAndCount(ctx: Ctx, message = LOGIN_FAILED_MESSAGE) {
  const status = await registerLoginFailure(ctx.admin, ctx.ip);
  if (status.newlyBlocked) await notifyBlocked(ctx.admin, ctx.ip);
  return failure(status.blocked ? LOGIN_BLOCKED_MESSAGE : message);
}

/** 토큰을 서버에서 검증해 사용자·세션 id·이메일을 읽는다. 세션이 없으면 null */
async function readSession(
  supabase: ServerSupabase,
): Promise<SessionInfo | null> {
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub || !claims.session_id) return null;
  return {
    userId: claims.sub,
    sessionId: String(claims.session_id),
    email: typeof claims.email === "string" ? claims.email : "",
  };
}

/** 세션을 "승인됨"으로 기록한다. 이후 is_admin()이 이 기록을 확인한다 */
async function approveSession(
  ctx: Ctx,
  session: SessionInfo,
  via: "trusted_ip" | "email_code",
) {
  const expiresAt = new Date(Date.now() + VERIFIED_SESSION_DAYS * 86_400_000);
  const { error } = await ctx.admin.from("admin_verified_sessions").upsert({
    session_id: session.sessionId,
    user_id: session.userId,
    verified_via: via,
    ip: ctx.ip,
    expires_at: expiresAt.toISOString(),
  });
  if (error) throw new Error(`세션 승인 기록 실패: ${error.message}`);
}

/** 프로필 행이 없으면 기본 표시 이름으로 처음 한 번 만든다 */
async function ensureProfile(admin: AdminClient, userId: string) {
  await admin
    .from("profiles")
    .upsert(
      { id: userId, display_name: profileConfig.displayName },
      { onConflict: "id", ignoreDuplicates: true },
    );
}

/** 로그인을 마무리한다: 세션 승인 → 프로필 보장 → 연속 실패 초기화 → 이동 경로 */
async function completeLogin(
  ctx: Ctx,
  session: SessionInfo,
  next: string | undefined,
  via: "trusted_ip" | "email_code",
): Promise<ActionResult<LoginOutcome>> {
  // 서로 독립이라 동시에 처리해 왕복 횟수를 줄인다
  await Promise.all([
    approveSession(ctx, session, via),
    ensureProfile(ctx.admin, session.userId),
    resetLoginFailures(ctx.admin, ctx.ip),
  ]);
  return { ok: true, data: { status: "done", redirectTo: sanitizeNext(next) } };
}

/** 인증 코드를 발급해 메일로 보낸다. 성공하면 null, 실패하면 보여 줄 문구를 돌려준다 */
async function sendCode(
  ctx: Ctx,
  session: SessionInfo,
): Promise<string | null> {
  const issued = await issueChallenge(ctx.admin, {
    userId: session.userId,
    sessionId: session.sessionId,
    ip: ctx.ip,
  });
  if (!issued.ok) return CODE_RESEND_LIMITED_MESSAGE;
  const mail = buildCodeMail(session.email, issued.code, ctx.ip);
  return (await sendMail(mail)) ? null : LOGIN_UNAVAILABLE_MESSAGE;
}

/** 새 IP: 코드를 보내고 코드 입력 단계로 넘긴다. 보내지 못하면 세션을 정리한다 */
async function requestCode(ctx: Ctx, session: SessionInfo) {
  const problem = await sendCode(ctx, session);
  if (!problem) return { ok: true, data: { status: "code_required" } } as const;
  await ctx.supabase.auth.signOut();
  return failure(problem);
}

/**
 * 1단계 로그인. 차단 IP는 로직을 실행하지 않고, 비밀번호와 허용 목록을 확인한 뒤
 * 신뢰 IP면 즉시 로그인하고 새 IP면 이메일 인증 코드 단계로 넘긴다.
 * @param values 로그인 폼 입력값
 * @param next 로그인 후 돌아갈 경로
 */
export async function runLogin(
  values: { email: string; password: string },
  next?: string,
): Promise<ActionResult<LoginOutcome>> {
  const ctx = await createContext();
  if (await isIpBlocked(ctx.admin, ctx.ip))
    return failure(LOGIN_BLOCKED_MESSAGE);

  const parsed = loginFormSchema.safeParse(values);
  if (!parsed.success) return failAndCount(ctx);
  const { error } = await ctx.supabase.auth.signInWithPassword(parsed.data);
  if (error) return failAndCount(ctx);

  const session = await readSession(ctx.supabase);
  const [allowed, trusted] = session
    ? await Promise.all([
        isAllowlistedAdmin(ctx.admin, session.userId),
        isTrustedIp(ctx.admin, session.userId, ctx.ip),
      ])
    : [false, false];
  if (!session || !allowed) {
    await ctx.supabase.auth.signOut();
    return failAndCount(ctx);
  }
  if (trusted) return completeLogin(ctx, session, next, "trusted_ip");
  return requestCode(ctx, session);
}

/**
 * 2단계 로그인. 이메일로 받은 코드를 검증하고, 성공하면 세션을 승인하고 이 IP를 신뢰 IP로 저장한다.
 * 틀린 코드는 IP 연속 실패에 합산한다.
 * @param code 사용자가 입력한 인증 코드
 * @param next 로그인 후 돌아갈 경로
 */
export async function runVerifyCode(
  code: string,
  next?: string,
): Promise<ActionResult<LoginOutcome>> {
  const ctx = await createContext();
  if (await isIpBlocked(ctx.admin, ctx.ip))
    return failure(LOGIN_BLOCKED_MESSAGE);
  const session = await readSession(ctx.supabase);
  if (!session) return failure(CODE_EXPIRED_MESSAGE);
  if (!CODE_PATTERN.test(code)) return failAndCount(ctx, CODE_MISMATCH_MESSAGE);

  const result = await verifyChallenge(
    ctx.admin,
    { ...session, ip: ctx.ip },
    code,
  );
  if (result === "mismatch") return failAndCount(ctx, CODE_MISMATCH_MESSAGE);
  if (result !== "ok") {
    await ctx.supabase.auth.signOut();
    return failure(CODE_EXPIRED_MESSAGE);
  }
  await addTrustedIp(ctx.admin, session.userId, ctx.ip);
  await notifyNewTrustedIp(session.email, ctx.ip);
  return completeLogin(ctx, session, next, "email_code");
}

/** 인증 코드를 다시 보낸다(재발송 간격·시간당 상한이 적용된다) */
export async function runResendCode(): Promise<ActionResult<null>> {
  const ctx = await createContext();
  if (await isIpBlocked(ctx.admin, ctx.ip))
    return failure(LOGIN_BLOCKED_MESSAGE);
  const session = await readSession(ctx.supabase);
  if (!session) return failure(CODE_EXPIRED_MESSAGE);
  const problem = await sendCode(ctx, session);
  return problem ? failure(problem) : { ok: true, data: null };
}

/** 설정·연결 문제로 던져진 오류를 사용자용 실패 결과로 바꾼다 */
export function unavailable() {
  return failure(LOGIN_UNAVAILABLE_MESSAGE, "unknown");
}
