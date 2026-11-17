import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import type { AdminClient } from "@/lib/supabase/admin";
import {
  CODE_HOURLY_LIMIT,
  CODE_LENGTH,
  CODE_MAX_ATTEMPTS,
  CODE_RESEND_COOLDOWN_SECONDS,
  CODE_TTL_MINUTES,
} from "./constants";

/** 인증 코드를 발급할 때 필요한 값 */
export type ChallengeTarget = { userId: string; sessionId: string; ip: string };

/** 발급 결과. 너무 자주 요청하면 cooldown(재발송 간격), limit(시간당 상한)로 거절한다 */
export type IssueResult =
  { ok: true; code: string } | { ok: false; reason: "cooldown" | "limit" };

/** 검증 결과. mismatch는 틀린 코드, invalid는 없음·만료·소진, ip_changed는 요청 때와 다른 IP */
export type VerifyResult = "ok" | "mismatch" | "invalid" | "ip_changed";

/** 8자리 숫자 인증 코드를 만든다 (암호학적 난수) */
export function generateCode(): string {
  return randomInt(0, 10 ** CODE_LENGTH)
    .toString()
    .padStart(CODE_LENGTH, "0");
}

/**
 * 코드를 HMAC-SHA256으로 해시한다. 키는 서버 비밀(서비스 키)이라 DB만 유출돼도 8자리 코드를 역산할 수 없다.
 * @param code 평문 코드
 * @throws 서비스 키가 없을 때
 */
export function hashCode(code: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret)
    throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다");
  return createHmac("sha256", secret).update(code).digest("hex");
}

/** 두 해시 문자열을 시간 차이 없이 비교한다 */
function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** 최근 1시간 안에 발급된 코드의 발급 시각들을 최신순으로 가져온다 */
async function recentIssueTimes(
  admin: AdminClient,
  userId: string,
): Promise<number[]> {
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { data } = await admin
    .from("admin_login_challenges")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => new Date(row.created_at).getTime());
}

/** 이전에 발급한 미사용 코드를 모두 폐기하고, 오래된 행을 정리한다 */
async function retireOldChallenges(admin: AdminClient, userId: string) {
  const now = new Date();
  await admin
    .from("admin_login_challenges")
    .update({ consumed_at: now.toISOString() })
    .eq("user_id", userId)
    .is("consumed_at", null);
  const cutoff = new Date(now.getTime() - 86_400_000).toISOString();
  await admin.from("admin_login_challenges").delete().lt("expires_at", cutoff);
}

/**
 * 인증 코드를 발급한다. 재발송 간격과 시간당 상한을 넘으면 거절하고, 새로 발급하면 이전 코드는 폐기한다.
 * @param admin 서비스 키 클라이언트
 * @param target 사용자·세션·요청 IP
 * @returns 평문 코드(메일로만 전달하고 저장하지 않는다)
 */
export async function issueChallenge(
  admin: AdminClient,
  target: ChallengeTarget,
): Promise<IssueResult> {
  const times = await recentIssueTimes(admin, target.userId);
  const cooldownMs = CODE_RESEND_COOLDOWN_SECONDS * 1000;
  if (times[0] !== undefined && Date.now() - times[0] < cooldownMs) {
    return { ok: false, reason: "cooldown" };
  }
  if (times.length >= CODE_HOURLY_LIMIT) return { ok: false, reason: "limit" };

  await retireOldChallenges(admin, target.userId);
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000);
  const { error } = await admin.from("admin_login_challenges").insert({
    user_id: target.userId,
    session_id: target.sessionId,
    ip: target.ip,
    code_hash: hashCode(code),
    expires_at: expiresAt.toISOString(),
  });
  if (error) throw new Error(`인증 코드 저장 실패: ${error.message}`);
  return { ok: true, code };
}

type ChallengeRow = { id: string; attempts: number };

/** 틀린 코드를 1회 기록한다. 최대 횟수에 도달하면 코드를 폐기한다 */
async function recordMismatch(admin: AdminClient, row: ChallengeRow) {
  const attempts = row.attempts + 1;
  const retired = attempts >= CODE_MAX_ATTEMPTS;
  await admin
    .from("admin_login_challenges")
    .update({
      attempts,
      ...(retired ? { consumed_at: new Date().toISOString() } : {}),
    })
    .eq("id", row.id)
    .eq("attempts", row.attempts);
}

/**
 * 사용자가 입력한 코드를 검증한다. 코드는 이 세션·이 IP에서 요청한 것이어야 하고,
 * 만료 전이며 오입력 한도 안이어야 한다. 성공하면 코드를 소진해 재사용할 수 없게 한다.
 * @param admin 서비스 키 클라이언트
 * @param target 현재 세션·IP(요청 때와 같아야 한다)
 * @param code 사용자가 입력한 코드
 */
export async function verifyChallenge(
  admin: AdminClient,
  target: ChallengeTarget,
  code: string,
): Promise<VerifyResult> {
  const { data: row } = await admin
    .from("admin_login_challenges")
    .select("id, ip, code_hash, attempts, expires_at")
    .eq("user_id", target.userId)
    .eq("session_id", target.sessionId)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const expired = !row || new Date(row.expires_at).getTime() <= Date.now();
  if (!row || expired || row.attempts >= CODE_MAX_ATTEMPTS) return "invalid";
  if (row.ip !== target.ip) return "ip_changed";
  if (!safeEqual(hashCode(code), row.code_hash)) {
    await recordMismatch(admin, row);
    return "mismatch";
  }
  const { data: used } = await admin
    .from("admin_login_challenges")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", row.id)
    .is("consumed_at", null)
    .select("id");
  return used?.length ? "ok" : "invalid";
}
