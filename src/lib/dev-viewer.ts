/** 개발 전용 관리자 미리보기를 켜는 쿠키 이름 */
export const DEV_VIEWER_COOKIE = "dev-viewer";

/** 관리자 미리보기를 켠 쿠키 값 */
export const DEV_VIEWER_ADMIN = "admin";

/**
 * 개발 전용 관리자 미리보기를 쓸 수 있는 환경인지 판정한다.
 * 프로덕션에서는 항상 false라서 쿠키를 읽지 않고 방문자로 고정된다.
 */
export function isDevViewerEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}
