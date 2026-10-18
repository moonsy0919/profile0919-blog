import { getWeatherTheme } from "./theme";
import type { DropKind, WeatherKey } from "./types";

export type Star = { left: number; top: number; size: number; opacity: number };
export type Drop = {
  left: number;
  len: number;
  x2: number;
  fromX: number;
  toX: number;
  dur: number;
  delay: number;
};
export type Flake = {
  left: number;
  r: number;
  toX: number;
  dur: number;
  delay: number;
};
/** 구름 타원: top/height는 px, 나머지 위치·크기는 % */
export type Cloud = {
  left: number;
  top: number;
  width: number;
  height: number;
  alpha: number;
};
export type FogBand = Omit<Cloud, "alpha">;

/** 빗방울 종류별 길이·속도·색 사양 */
export type DropSpec = {
  count: number;
  len: [number, number];
  dur: [number, number];
  stroke: string;
  strokeWidth: number;
  slant: number;
};

export type Effects = {
  stars: Star[];
  drops: Drop[];
  dropSpec: DropSpec | null;
  flakes: Flake[];
  clouds: Cloud[];
  fog: FogBand[];
};

export const DROP_SPECS: Record<DropKind, DropSpec> = {
  drizzle: {
    count: 55,
    len: [6, 10],
    dur: [1.0, 1.5],
    stroke: "rgba(205, 225, 255, 0.38)",
    strokeWidth: 1,
    slant: 0,
  },
  rain: {
    count: 90,
    len: [12, 24],
    dur: [0.45, 0.75],
    stroke: "rgba(205, 225, 255, 0.5)",
    strokeWidth: 1.3,
    slant: 0,
  },
  shower: {
    count: 140,
    len: [18, 32],
    dur: [0.32, 0.5],
    stroke: "rgba(205, 225, 255, 0.6)",
    strokeWidth: 1.5,
    slant: 0.2,
  },
  sleet: {
    count: 45,
    len: [10, 18],
    dur: [0.6, 0.9],
    stroke: "rgba(205, 225, 255, 0.45)",
    strokeWidth: 1.2,
    slant: 0,
  },
};

/** 구름 밀도(0~3)별 [left %, top px, width %, height px, alpha] */
const CLOUD_LAYOUTS: number[][][] = [
  [],
  [
    [6, -60, 26, 120, 0.13],
    [58, -50, 24, 110, 0.12],
  ],
  [
    [-6, -40, 30, 130, 0.17],
    [30, 20, 26, 110, 0.15],
    [62, -50, 30, 140, 0.17],
    [84, 30, 24, 110, 0.15],
  ],
  [
    [-6, -40, 34, 140, 0.2],
    [20, 30, 30, 110, 0.18],
    [44, -50, 36, 150, 0.2],
    [66, 40, 30, 120, 0.18],
    [86, -30, 26, 130, 0.2],
    [30, 120, 40, 100, 0.14],
  ],
];

/** 안개 띠 [left %, top px, width %, height px] */
const FOG_LAYOUT: number[][] = [
  [-10, 30, 70, 46],
  [30, 70, 80, 52],
  [-5, 120, 75, 50],
  [45, 150, 70, 48],
];

/** 시드 고정 의사난수: SSR/CSR에서 같은 결과를 내기 위해 Math.random 대신 사용 */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

/** 소수점 n자리로 반올림한 숫자 */
function round(value: number, digits: number): number {
  return Number(value.toFixed(digits));
}

function makeStars(rnd: () => number): Star[] {
  return Array.from({ length: 60 }, () => {
    const size = round(1 + rnd() * 1.4, 1);
    return {
      size,
      left: round(rnd() * 100, 1),
      top: round(rnd() * 90, 1),
      opacity: round(0.35 + rnd() * 0.65, 2),
    };
  });
}

function makeDrops(rnd: () => number, spec: DropSpec): Drop[] {
  const dx = spec.slant * 250;
  return Array.from({ length: spec.count }, () => {
    const len = round(spec.len[0] + rnd() * (spec.len[1] - spec.len[0]), 0);
    const dur = round(spec.dur[0] + rnd() * (spec.dur[1] - spec.dur[0]), 2);
    return {
      len,
      dur,
      left: round(rnd() * 104 - 2, 1),
      x2: round(2 - len * spec.slant, 1),
      fromX: round(dx * 0.15, 0),
      toX: -dx,
      delay: -round(rnd() * dur, 2),
    };
  });
}

function makeFlakes(rnd: () => number, count: number): Flake[] {
  return Array.from({ length: count }, () => {
    const dur = round(4 + rnd() * 4, 1);
    return {
      dur,
      left: round(rnd() * 100, 1),
      r: round(1.3 + rnd() * 1.8, 1),
      toX: round((rnd() - 0.5) * 40, 0),
      delay: -round(rnd() * dur, 1),
    };
  });
}

const cache = new Map<WeatherKey | "none", Effects>();

/** 날씨별 효과 요소(별·구름·안개·빗방울·눈송이)를 만든다. 결과는 키별로 캐시된다. */
export function buildEffects(weather: WeatherKey | null): Effects {
  const cacheKey = weather ?? "none";
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const theme = getWeatherTheme(weather);
  const rnd = createRandom(23);
  const stars = makeStars(rnd);
  const dropSpec = theme.drops ? DROP_SPECS[theme.drops] : null;
  const effects: Effects = {
    stars,
    dropSpec,
    drops: dropSpec ? makeDrops(rnd, dropSpec) : [],
    flakes: makeFlakes(rnd, theme.flakes),
    clouds: CLOUD_LAYOUTS[theme.clouds].map(
      ([left, top, width, height, alpha]) => ({
        left,
        top,
        width,
        height,
        alpha,
      }),
    ),
    fog: theme.fog
      ? FOG_LAYOUT.map(([left, top, width, height]) => ({
          left,
          top,
          width,
          height,
        }))
      : [],
  };
  cache.set(cacheKey, effects);
  return effects;
}
