/**
 * 날씨 헤더가 조회·표시하는 지점. 서울로 고정한다.
 * 클라이언트 컴포넌트도 가져다 쓰므로 환경 변수나 package.json에 의존하지 않는 정적 값만 둔다.
 */
export const weatherConfig = {
  /** 화면에 표시하는 도시 이름. Open-Meteo는 이름을 주지 않아 직접 고정한다. */
  city: "서울",
  latitude: 37.5665,
  longitude: 126.978,
  /** 시각·일출·일몰을 해석하는 IANA 타임존 */
  timezone: "Asia/Seoul",
} as const;
