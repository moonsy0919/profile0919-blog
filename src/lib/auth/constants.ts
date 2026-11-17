/** 로그인 실패 문구. 계정 존재 여부·허용 목록 여부가 드러나지 않도록 모든 실패를 이 한 가지로 통일한다 (PRD 4.5) */
export const LOGIN_FAILED_MESSAGE = "아이디 또는 비밀번호가 올바르지 않습니다";

/** 차단된 IP에 보여 주는 안내 문구. 로그인 로직은 실행하지 않고 이 문구만 돌려준다 */
export const LOGIN_BLOCKED_MESSAGE =
  "이 IP에서의 로그인이 차단되었습니다. 관리자에게 문의해 주세요";

/** 인증 코드가 만료되었거나 더 이상 쓸 수 없을 때의 안내 문구 */
export const CODE_EXPIRED_MESSAGE =
  "인증 코드가 만료되었거나 올바르지 않습니다. 다시 로그인해 주세요";

/** 인증 코드 재발송이 제한될 때의 안내 문구 */
export const CODE_RESEND_LIMITED_MESSAGE =
  "인증 코드를 너무 자주 요청했습니다. 잠시 후 다시 시도해 주세요";

/** 로그인 서비스 설정·연결 문제로 처리하지 못할 때의 안내 문구 */
export const LOGIN_UNAVAILABLE_MESSAGE =
  "지금은 로그인을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요";

/** 연속 실패가 이 횟수에 도달하면 IP를 차단한다 (DB 함수의 기본값과 같다) */
export const MAX_CONSECUTIVE_FAILURES = 5;

/** 인증 코드 자릿수 */
export const CODE_LENGTH = 8;

/** 인증 코드 유효 시간(분) */
export const CODE_TTL_MINUTES = 10;

/** 인증 코드 최대 오입력 횟수. 도달하면 코드를 폐기한다 */
export const CODE_MAX_ATTEMPTS = 5;

/** 인증 코드 재발송 간격(초) */
export const CODE_RESEND_COOLDOWN_SECONDS = 60;

/** 한 사용자에게 1시간 안에 보낼 수 있는 인증 코드 메일 수 */
export const CODE_HOURLY_LIMIT = 5;

/** 신뢰 IP가 이 기간(일) 동안 쓰이지 않으면 만료된다 */
export const TRUSTED_IP_IDLE_DAYS = 90;

/** 승인된 세션의 유효 기간(일). 지나면 다시 승인해야 한다 */
export const VERIFIED_SESSION_DAYS = 30;

/** 차단 알림 메일을 1시간 안에 보낼 수 있는 최대 수(여러 IP의 동시 시도로 메일이 쏟아지는 것을 막는다) */
export const BLOCK_MAIL_HOURLY_LIMIT = 5;

/** IP를 알 수 없을 때 쓰는 값. 신뢰 IP로는 절대 등록하지 않는다 */
export const UNKNOWN_IP = "unknown";

/** 인증 코드를 틀리게 입력했을 때의 안내 문구 */
export const CODE_MISMATCH_MESSAGE = "인증 코드가 올바르지 않습니다";
