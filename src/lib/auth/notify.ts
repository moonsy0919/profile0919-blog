import type { AdminClient } from "@/lib/supabase/admin";
import { getAdminEmails } from "./admins";
import { buildBlockedMail, buildNewTrustedIpMail } from "./auth-mails";
import { BLOCK_MAIL_HOURLY_LIMIT } from "./constants";
import { countRecentBlocks } from "./ip-attempts";
import { sendMail } from "./mailer";

/**
 * IP가 새로 차단됐음을 관리자에게 메일로 알린다. 여러 IP가 동시에 시도해도 메일이 쏟아지지 않도록
 * 최근 1시간의 차단 수가 상한을 넘으면 보내지 않는다. 실패해도 로그인 흐름을 막지 않는다.
 * @param admin 서비스 키 클라이언트
 * @param ip 차단된 IP
 */
export async function notifyBlocked(
  admin: AdminClient,
  ip: string,
): Promise<void> {
  try {
    if ((await countRecentBlocks(admin)) > BLOCK_MAIL_HOURLY_LIMIT) return;
    const now = new Date();
    const emails = await getAdminEmails(admin);
    await Promise.all(
      emails.map((to) => sendMail(buildBlockedMail(to, ip, now))),
    );
  } catch (error) {
    console.error("[auth] 차단 알림 메일 처리 실패", error);
  }
}

/**
 * 새 신뢰 IP가 등록됐음을 알린다. 실패해도 로그인 흐름을 막지 않는다.
 * @param to 관리자 이메일
 * @param ip 신뢰 IP로 등록된 IP
 */
export async function notifyNewTrustedIp(
  to: string,
  ip: string,
): Promise<void> {
  try {
    await sendMail(buildNewTrustedIpMail(to, ip, new Date()));
  } catch (error) {
    console.error("[auth] 신뢰 IP 알림 메일 처리 실패", error);
  }
}
