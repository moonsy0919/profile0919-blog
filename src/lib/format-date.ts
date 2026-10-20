/**
 * 날짜를 서울 기준 ko-KR 형식(예: 2026. 10. 20.)으로 바꾼다.
 * @param iso ISO 날짜 문자열
 */
export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
}
