/** 날씨 코드(WMO)를 헤더용으로 단순화한 날씨 키 */
export type WeatherKey =
  | "clear"
  | "few-clouds"
  | "scattered-clouds"
  | "overcast"
  | "mist"
  | "drizzle"
  | "rain"
  | "shower"
  | "thunderstorm"
  | "snow"
  | "sleet";

/** 하루를 여섯 구간으로 나눈 시간대 키 */
export type TimeKey =
  "dawn" | "morning" | "noon" | "afternoon" | "evening" | "night";

/** 빗방울 종류 */
export type DropKind = "drizzle" | "rain" | "shower" | "sleet";

/** 날씨 아이콘 이름 (낮/밤 변형 포함 13종) */
export type IconName =
  | "sun"
  | "moon"
  | "partSun"
  | "partMoon"
  | "cloud"
  | "clouds"
  | "fog"
  | "drizzle"
  | "rain"
  | "shower"
  | "thunder"
  | "snow"
  | "sleet";

/** `/api/weather`가 반환하는 정규화된 날씨 데이터 */
export type WeatherPayload = {
  weather: WeatherKey;
  /** Open-Meteo가 준 WMO 날씨 코드 원본 */
  weatherCode: number;
  /** 정수 반올림, °C */
  temp: number;
  high: number;
  low: number;
  city: string;
  /** unix seconds */
  sunrise: number;
  sunset: number;
  fetchedAt: number;
};
