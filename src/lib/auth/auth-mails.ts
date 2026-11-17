import { CODE_TTL_MINUTES } from "./constants";
import type { MailMessage } from "./mailer";

/** 메일에 표시할 서울 시각 */
function formatKst(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

/**
 * 새 IP 로그인 인증 코드 메일
 * @param to 관리자 이메일
 * @param code 평문 인증 코드
 * @param ip 로그인을 시도한 IP
 */
export function buildCodeMail(
  to: string,
  code: string,
  ip: string,
): MailMessage {
  return {
    to,
    subject: "[Profile0919] 로그인 인증 코드",
    text: [
      "새로운 IP에서 관리자 로그인을 시도했습니다.",
      "",
      `인증 코드: ${code}`,
      `시도한 IP: ${ip}`,
      `유효 시간: ${CODE_TTL_MINUTES}분 (한 번만 사용할 수 있습니다)`,
      "",
      "본인이 시도한 것이 아니라면 코드를 입력하지 말고, Supabase 대시보드에서 비밀번호를 바꿔 주세요.",
    ].join("\n"),
  };
}

/**
 * 새 신뢰 IP 등록 알림 메일
 * @param to 관리자 이메일
 * @param ip 신뢰 IP로 등록된 IP
 * @param at 등록 시각
 */
export function buildNewTrustedIpMail(
  to: string,
  ip: string,
  at: Date,
): MailMessage {
  return {
    to,
    subject: "[Profile0919] 새 IP가 신뢰 IP로 등록되었습니다",
    text: [
      "이메일 인증을 통과한 IP가 신뢰 IP로 등록되었습니다. 이 IP에서는 이후 비밀번호만으로 로그인됩니다.",
      "",
      `IP: ${ip}`,
      `시각: ${formatKst(at)}`,
      "",
      "본인이 아니라면 Supabase 대시보드 Table Editor의 admin_trusted_ips에서 해당 행을 삭제하고 비밀번호를 바꿔 주세요.",
    ].join("\n"),
  };
}

/**
 * IP 차단 알림 메일
 * @param to 관리자 이메일
 * @param ip 차단된 IP
 * @param at 차단 시각
 */
export function buildBlockedMail(
  to: string,
  ip: string,
  at: Date,
): MailMessage {
  return {
    to,
    subject: "[Profile0919] 로그인 시도가 차단되었습니다",
    text: [
      "한 IP에서 로그인이 5회 연속 실패해 해당 IP를 차단했습니다. 차단은 자동으로 풀리지 않습니다.",
      "",
      `IP: ${ip}`,
      `시각: ${formatKst(at)}`,
      "",
      "본인이 비밀번호를 잘못 입력한 것이라면 Supabase 대시보드 Table Editor의 admin_ip_attempts에서 해당 IP 행을 삭제하면 해제됩니다.",
      "본인이 아니라면 아무것도 하지 않아도 됩니다. 반복되면 비밀번호를 바꿔 주세요.",
    ].join("\n"),
  };
}
