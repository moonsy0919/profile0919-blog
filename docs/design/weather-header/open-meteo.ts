import { toWeatherKey } from "./classify";
import type { WeatherPayload } from "./types";

/** Open-Meteo는 도시 이름을 주지 않으므로 조회 지점의 표시명을 고정한다. */
export const WEATHER_CITY = "서울";

/** Open-Meteo `/v1/forecast` 응답 중 사용하는 부분 (`timeformat=unixtime`, `forecast_days=1`) */
export type OpenMeteoResponse = {
  current: { temperature_2m: number; weather_code: number };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    /** unix seconds */
    sunrise: number[];
    /** unix seconds */
    sunset: number[];
  };
};

/** 값이 유한한 숫자가 아니면 예외를 던진다. route가 502로 처리한다. */
function requireNumber(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Open-Meteo 응답에 ${name} 값이 없어요`);
  }
  return value;
}

/** Open-Meteo 응답을 클라이언트용 WeatherPayload로 정규화한다. */
export function buildWeatherPayload(
  response: OpenMeteoResponse,
  nowSec: number,
): WeatherPayload {
  const { current, daily } = response;
  const code = requireNumber(current?.weather_code, "weather_code");
  return {
    weather: toWeatherKey(code),
    weatherCode: code,
    temp: Math.round(requireNumber(current.temperature_2m, "temperature_2m")),
    high: Math.round(
      requireNumber(daily?.temperature_2m_max?.[0], "temperature_2m_max"),
    ),
    low: Math.round(
      requireNumber(daily?.temperature_2m_min?.[0], "temperature_2m_min"),
    ),
    city: WEATHER_CITY,
    sunrise: requireNumber(daily.sunrise?.[0], "sunrise"),
    sunset: requireNumber(daily.sunset?.[0], "sunset"),
    fetchedAt: nowSec,
  };
}
