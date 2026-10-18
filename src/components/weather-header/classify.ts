import { weatherConfig } from "@/config/weather";
import type { TimeKey, WeatherKey, WeatherPayload } from "./types";

const KST_OFFSET_SEC = 9 * 3600;
const DAY_SEC = 86400;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** 해가 뜨고 지는 시각 (KST 기준 시, 소수 포함) */
export type SunHours = { sunrise: number; sunset: number };

/** 날씨 정보가 없을 때 쓰는 기본 일출·일몰 */
export const DEFAULT_SUN_HOURS: SunHours = { sunrise: 6.5, sunset: 18 };

/** Asia/Seoul 기준으로 분해한 현재 시각 */
export type KstParts = {
  month: number;
  day: number;
  /** 0(일) ~ 6(토) */
  weekday: number;
  hour: number;
  minute: number;
};

/** WMO 날씨 코드 → WeatherKey. WMO에는 비·눈 혼합 코드가 없어 sleet은 어는 비·이슬비로 근사한다. */
const WMO_TO_WEATHER_KEY: Record<number, WeatherKey> = {
  0: "clear",
  1: "few-clouds",
  2: "scattered-clouds",
  3: "overcast",
  45: "mist",
  48: "mist",
  51: "drizzle",
  53: "drizzle",
  55: "drizzle",
  56: "sleet",
  57: "sleet",
  61: "rain",
  63: "rain",
  65: "rain",
  66: "sleet",
  67: "sleet",
  71: "snow",
  73: "snow",
  75: "snow",
  77: "snow",
  80: "shower",
  81: "shower",
  82: "shower",
  85: "snow",
  86: "snow",
  95: "thunderstorm",
  96: "thunderstorm",
  99: "thunderstorm",
};

/** Open-Meteo `weather_code`(WMO)를 WeatherKey로 변환한다. 알 수 없는 코드는 overcast. */
export function toWeatherKey(code: number): WeatherKey {
  return WMO_TO_WEATHER_KEY[code] ?? "overcast";
}

/** 시각(0~24, 소수 가능)을 시간대 키로 변환한다. */
export function toTimeKey(hour: number): TimeKey {
  if (hour >= 4 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 11) return "morning";
  if (hour >= 11 && hour < 14) return "noon";
  if (hour >= 14 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

/** 주어진 Date를 Asia/Seoul 기준 월·일·요일·시·분으로 분해한다. */
export function getKstParts(date: Date): KstParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: weatherConfig.timezone,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    month: "numeric",
    day: "numeric",
  });
  const parts: Record<string, string> = {};
  formatter.formatToParts(date).forEach((part) => {
    parts[part.type] = part.value;
  });
  return {
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: Math.max(0, WEEKDAYS.indexOf(parts.weekday)),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
  };
}

/** unix seconds를 KST 기준 시(소수 포함)로 변환한다. */
export function secToKstHour(sec: number): number {
  const secOfDay = (((sec + KST_OFFSET_SEC) % DAY_SEC) + DAY_SEC) % DAY_SEC;
  return secOfDay / 3600;
}

/** 날씨 응답이 있으면 그 일출·일몰을, 없으면 기본값(06:30–18:00)을 돌려준다. */
export function getSunHours(payload: WeatherPayload | null): SunHours {
  if (!payload || !payload.sunrise || !payload.sunset) return DEFAULT_SUN_HOURS;
  return {
    sunrise: secToKstHour(payload.sunrise),
    sunset: secToKstHour(payload.sunset),
  };
}

/** 해당 시각이 낮인지 판단한다. */
export function isDaytime(
  hour: number,
  sun: SunHours = DEFAULT_SUN_HOURS,
): boolean {
  return hour >= sun.sunrise && hour < sun.sunset;
}
