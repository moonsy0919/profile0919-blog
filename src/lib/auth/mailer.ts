/** 보낼 메일 한 통 */
export type MailMessage = { to: string; subject: string; text: string };

const RESEND_URL = "https://api.resend.com/emails";
const RESEND_TIMEOUT_MS = 8000;
/** 도메인 인증 전에도 Resend 계정 소유자 주소로는 보낼 수 있는 기본 발신 주소 */
const DEFAULT_FROM = "Profile0919 <onboarding@resend.dev>";

/** Resend API로 메일을 보낸다. 실패해도 던지지 않고 false를 돌려준다 */
async function sendWithResend(
  apiKey: string,
  message: MailMessage,
): Promise<boolean> {
  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.AUTH_EMAIL_FROM ?? DEFAULT_FROM,
        to: [message.to],
        subject: message.subject,
        text: message.text,
      }),
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
    });
    if (!response.ok) console.error("[auth] 메일 발송 실패", response.status);
    return response.ok;
  } catch (error) {
    console.error("[auth] 메일 발송 중 오류", error);
    return false;
  }
}

/**
 * 메일을 보낸다. RESEND_API_KEY가 있으면 Resend로 보내고,
 * 없으면 개발 환경에서만 콘솔에 출력한다(로컬에서 인증 코드를 확인하기 위함).
 * 운영에서 키가 없으면 보내지 않고 false를 돌려준다(코드 등 민감한 내용을 로그에 남기지 않는다).
 * @param message 받는 사람·제목·본문
 * @returns 발송(또는 개발용 출력)에 성공했는지
 */
export async function sendMail(message: MailMessage): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) return sendWithResend(apiKey, message);
  if (process.env.NODE_ENV !== "production") {
    console.info(
      `[mail:dev] ${message.to} | ${message.subject}\n${message.text}`,
    );
    return true;
  }
  console.error("[auth] RESEND_API_KEY가 없어 메일을 보내지 못했습니다");
  return false;
}
