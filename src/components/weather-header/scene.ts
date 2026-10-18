import type { CSSProperties } from "react";
import {
  DEFAULT_SUN_HOURS,
  getKstParts,
  getSunHours,
  isDaytime,
  toTimeKey,
  type SunHours,
} from "./classify";
import { formatClock, formatClockFromHour, formatKstDate } from "./format";
import { TIME_THEMES, WEATHER_THEMES, getMockTemp } from "./theme";
import type { TimeKey, WeatherKey, WeatherPayload } from "./types";

/** 시각을 아직 모를 때(마운트 전) 하늘 색을 정하는 기본 시각 */
const FALLBACK_HOUR = 12;

/** 헤더 오른쪽에 보여 줄 날씨 요약 */
export type WeatherReport = {
  temp: number;
  high: number;
  low: number;
  city: string;
  label: string;
};

/** 헤더를 그리는 데 필요한 값을 한데 모은 장면 정보 */
export type Scene = {
  /** 시각(소수 포함). 마운트 전에는 null */
  hour: number | null;
  timeKey: TimeKey;
  weather: WeatherKey | null;
  night: boolean;
  sun: SunHours;
  clock: string | null;
  date: string | null;
  report: WeatherReport | null;
};

export type SceneInput = {
  nowMs: number | null;
  payload: WeatherPayload | null;
  forceWeather?: WeatherKey;
  forceTime?: TimeKey | number;
};

/** forceTime을 시각(소수 포함)으로 바꾼다. 범위를 벗어나면 8시. */
function resolveForcedHour(forceTime: TimeKey | number | undefined) {
  if (forceTime === undefined) return null;
  if (typeof forceTime === "string") {
    return TIME_THEMES[forceTime].representativeHour;
  }
  return forceTime >= 0 && forceTime < 24 ? forceTime : 8;
}

/** 오른쪽 날씨 요약을 만든다. 강제 모드면 시연용 값, 아니면 API 응답. */
function buildReport(
  input: SceneInput,
  weather: WeatherKey | null,
  hour: number | null,
): WeatherReport | null {
  if (!weather) return null;
  const label = WEATHER_THEMES[weather].ko;
  if (input.forceWeather) {
    const [low, high] = WEATHER_THEMES[weather].lohi;
    const temp = getMockTemp(weather, hour ?? FALLBACK_HOUR);
    return { temp, high, low, city: "서울", label };
  }
  const { payload } = input;
  if (!payload) return null;
  const { temp, high, low, city } = payload;
  return { temp, high, low, city, label };
}

/** 시계·날짜 문자열을 만든다. 시각을 모르는 동안은 null(자리만 유지). */
function buildLabels(
  forcedHour: number | null,
  nowMs: number | null,
): Pick<Scene, "clock" | "date"> {
  const parts = nowMs !== null ? getKstParts(new Date(nowMs)) : null;
  const date = parts ? formatKstDate(parts) : null;
  if (forcedHour !== null) {
    return { clock: formatClockFromHour(forcedHour), date };
  }
  return { clock: parts ? formatClock(parts.hour, parts.minute) : null, date };
}

/** 현재 시각·날씨(또는 강제값)로부터 헤더 장면 정보를 계산한다. */
export function buildScene(input: SceneInput): Scene {
  const forcedHour = resolveForcedHour(input.forceTime);
  const parts =
    input.nowMs !== null ? getKstParts(new Date(input.nowMs)) : null;
  const hour = forcedHour ?? (parts ? parts.hour + parts.minute / 60 : null);
  const weather = input.forceWeather ?? input.payload?.weather ?? null;
  const useLiveSun = !input.forceWeather;
  const sun = useLiveSun ? getSunHours(input.payload) : DEFAULT_SUN_HOURS;
  return {
    hour,
    timeKey: toTimeKey(hour ?? FALLBACK_HOUR),
    weather,
    night: hour !== null && !isDaytime(hour, sun),
    sun,
    report: buildReport(input, weather, hour),
    ...buildLabels(forcedHour, input.nowMs),
  };
}

/**
 * 해(낮) 또는 달(밤) 광채의 위치·배경 스타일.
 * 낮에는 일출~일몰 진행률에 따라 포물선을 그리며 움직인다.
 */
export function getGlowStyle(scene: Scene): CSSProperties | null {
  const { hour, night, sun, timeKey } = scene;
  if (hour === null) return null;
  if (night) {
    return {
      left: "72%",
      top: "34%",
      background:
        "radial-gradient(circle, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0) 60%)",
    };
  }
  const progress = (hour - sun.sunrise) / (sun.sunset - sun.sunrise);
  const sp = Math.max(0, Math.min(1, progress));
  const warm = timeKey === "evening" || timeKey === "dawn";
  const core = warm ? "rgba(255, 170, 110, 0.55)" : "rgba(255, 238, 170, 0.5)";
  return {
    left: `${(12 + sp * 76).toFixed(1)}%`,
    top: `${(110 - 90 * Math.sin(Math.PI * sp)).toFixed(0)}px`,
    background: `radial-gradient(circle, ${core} 0%, rgba(255, 238, 170, 0) 62%)`,
  };
}
