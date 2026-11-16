import type { DropKind, IconName, TimeKey, WeatherKey } from "./types";

type Rgb = number[];

/** 시간대별 하늘 3색(위·중간·아래), 한글 이름, 미리보기용 대표 시각 */
export type TimeTheme = {
  ko: string;
  sky: readonly [string, string, string];
  representativeHour: number;
};

/** 날씨별 하늘 톤과 효과 파라미터 */
export type WeatherTheme = {
  ko: string;
  /** [회색 섞기, 밝기] */
  tone: readonly [number, number];
  /** 구름 밀도 0~3 */
  clouds: 0 | 1 | 2 | 3;
  /** 비·소나기·뇌우처럼 어두운 구름을 쓰는지 */
  dim?: boolean;
  fog?: boolean;
  flash?: boolean;
  /** 해 광채 불투명도 */
  glow: number;
  /** 별 불투명도 (새벽·밤에만 적용) */
  stars: number;
  drops: DropKind | null;
  flakes: number;
  /** 시연용 [최저, 최고] 기온 */
  lohi: readonly [number, number];
};

export const TIME_THEMES: Record<TimeKey, TimeTheme> = {
  dawn: {
    ko: "새벽",
    sky: ["#151C44", "#3E4483", "#C98B8A"],
    representativeHour: 6.75,
  },
  morning: {
    ko: "아침",
    sky: ["#2A6FBF", "#4F90D6", "#D9B48F"],
    representativeHour: 9,
  },
  noon: {
    ko: "점심",
    sky: ["#1C6FD1", "#3D8FE0", "#7DB9EE"],
    representativeHour: 12.5,
  },
  afternoon: {
    ko: "오후",
    sky: ["#2766B8", "#4C88D2", "#9CBFE6"],
    representativeHour: 15.5,
  },
  evening: {
    ko: "저녁",
    sky: ["#262B66", "#874A7E", "#E58A62"],
    representativeHour: 17.5,
  },
  night: {
    ko: "밤",
    sky: ["#060A1E", "#0F1838", "#1C2A55"],
    representativeHour: 22,
  },
};

export const WEATHER_THEMES: Record<WeatherKey, WeatherTheme> = {
  clear: {
    ko: "맑음",
    tone: [0, 1],
    clouds: 0,
    glow: 1,
    stars: 1,
    drops: null,
    flakes: 0,
    lohi: [13, 22],
  },
  "few-clouds": {
    ko: "구름 조금",
    tone: [0.12, 0.98],
    clouds: 1,
    glow: 0.8,
    stars: 0.7,
    drops: null,
    flakes: 0,
    lohi: [13, 21],
  },
  "scattered-clouds": {
    ko: "구름 많음",
    tone: [0.32, 0.94],
    clouds: 2,
    glow: 0.45,
    stars: 0.35,
    drops: null,
    flakes: 0,
    lohi: [14, 20],
  },
  overcast: {
    ko: "흐림",
    tone: [0.62, 0.85],
    clouds: 3,
    glow: 0,
    stars: 0.1,
    drops: null,
    flakes: 0,
    lohi: [14, 19],
  },
  mist: {
    ko: "안개",
    tone: [0.66, 0.92],
    clouds: 0,
    fog: true,
    glow: 0,
    stars: 0.05,
    drops: null,
    flakes: 0,
    lohi: [11, 18],
  },
  drizzle: {
    ko: "이슬비",
    tone: [0.58, 0.8],
    clouds: 3,
    glow: 0,
    stars: 0,
    drops: "drizzle",
    flakes: 0,
    lohi: [13, 17],
  },
  rain: {
    ko: "비",
    tone: [0.75, 0.64],
    clouds: 3,
    dim: true,
    glow: 0,
    stars: 0,
    drops: "rain",
    flakes: 0,
    lohi: [12, 16],
  },
  shower: {
    ko: "소나기",
    tone: [0.6, 0.7],
    clouds: 3,
    dim: true,
    glow: 0,
    stars: 0,
    drops: "shower",
    flakes: 0,
    lohi: [15, 21],
  },
  thunderstorm: {
    ko: "뇌우",
    tone: [0.8, 0.5],
    clouds: 3,
    dim: true,
    flash: true,
    glow: 0,
    stars: 0,
    drops: "rain",
    flakes: 0,
    lohi: [17, 23],
  },
  snow: {
    ko: "눈",
    tone: [0.55, 0.9],
    clouds: 3,
    glow: 0,
    stars: 0,
    drops: null,
    flakes: 70,
    lohi: [-5, 1],
  },
  sleet: {
    ko: "진눈깨비",
    tone: [0.65, 0.78],
    clouds: 3,
    glow: 0,
    stars: 0,
    drops: "sleet",
    flakes: 32,
    lohi: [-1, 3],
  },
};

/** 날씨를 아직 모를 때(로딩·실패) 쓰는 중립 테마: 시간대 하늘만 보여 준다. */
export const NEUTRAL_THEME: WeatherTheme = {
  ko: "",
  tone: [0, 1],
  clouds: 0,
  glow: 0,
  stars: 1,
  drops: null,
  flakes: 0,
  lohi: [0, 0],
};

export const WEATHER_KEYS = Object.keys(WEATHER_THEMES) as WeatherKey[];
export const TIME_KEYS = Object.keys(TIME_THEMES) as TimeKey[];

/** 날씨 키에 맞는 테마를 돌려준다. null이면 중립 테마. */
export function getWeatherTheme(weather: WeatherKey | null): WeatherTheme {
  return weather ? WEATHER_THEMES[weather] : NEUTRAL_THEME;
}

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return a.map((v, i) => v + (b[i] - v) * t);
}

function toRgbString(color: Rgb): string {
  const parts = color.map((v) => Math.round(Math.max(0, Math.min(255, v))));
  return `rgb(${parts.join(", ")})`;
}

/** 한 색에 날씨 톤(회색 섞기 + 밝기)을 적용한다. */
function applyTone(hex: string, [grey, bright]: readonly [number, number]) {
  const c = hexToRgb(hex);
  const l = c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11;
  const mixed = mixRgb(c, [l, l, l * 1.07], grey);
  return toRgbString(mixed.map((v) => v * bright));
}

/** 시간대 + 날씨 톤이 반영된 하늘 3색(위·중간·아래)을 돌려준다. */
export function getSkyColors(
  timeKey: TimeKey,
  weather: WeatherKey | null,
): [string, string, string] {
  const { tone } = getWeatherTheme(weather);
  const [top, mid, bottom] = TIME_THEMES[timeKey].sky;
  return [applyTone(top, tone), applyTone(mid, tone), applyTone(bottom, tone)];
}

/** 하늘 그라디언트 CSS 문자열 (180deg, 0% · 55% · 100%) */
export function getSkyGradient(
  timeKey: TimeKey,
  weather: WeatherKey | null,
): string {
  const [top, mid, bottom] = getSkyColors(timeKey, weather);
  return `linear-gradient(180deg, ${top} 0%, ${mid} 55%, ${bottom} 100%)`;
}

/** 새벽·밤처럼 어두운 시간대인지 */
export function isDarkTime(timeKey: TimeKey): boolean {
  return timeKey === "dawn" || timeKey === "night";
}

/** 별 불투명도: 새벽·밤에만 날씨별 값을 쓰고 그 외에는 0 */
export function getStarsOpacity(
  timeKey: TimeKey,
  weather: WeatherKey | null,
): number {
  return isDarkTime(timeKey) ? getWeatherTheme(weather).stars : 0;
}

const ICON_BY_WEATHER: Record<
  Exclude<WeatherKey, "clear" | "few-clouds">,
  IconName
> = {
  "scattered-clouds": "cloud",
  overcast: "clouds",
  mist: "fog",
  drizzle: "drizzle",
  rain: "rain",
  shower: "shower",
  thunderstorm: "thunder",
  snow: "snow",
  sleet: "sleet",
};

/** 날씨와 낮/밤에 맞는 아이콘 이름. 날씨를 모르면 null. */
export function getIconName(
  weather: WeatherKey | null,
  night: boolean,
): IconName | null {
  if (!weather) return null;
  if (weather === "clear") return night ? "moon" : "sun";
  if (weather === "few-clouds") return night ? "partMoon" : "partSun";
  return ICON_BY_WEATHER[weather];
}

/** 날씨 시연(forceWeather)용 가짜 현재 기온: 하루 사이클을 코사인으로 근사 */
export function getMockTemp(weather: WeatherKey, hour: number): number {
  const [lo, hi] = WEATHER_THEMES[weather].lohi;
  let x: number;
  if (hour >= 5 && hour < 15) {
    x = 0.5 - 0.5 * Math.cos((Math.PI * (hour - 5)) / 10);
  } else {
    const d = hour >= 15 ? hour - 15 : hour + 9;
    x = 0.5 + 0.5 * Math.cos((Math.PI * d) / 14);
  }
  return Math.round(lo + (hi - lo) * x);
}
