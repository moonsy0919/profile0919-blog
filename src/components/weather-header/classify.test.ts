import { describe, expect, it } from "vitest";
import {
  getSunHours,
  isDaytime,
  secToKstHour,
  toTimeKey,
  toWeatherKey,
} from "./classify";
import { buildWeatherPayload, type OpenMeteoResponse } from "./open-meteo";
import { buildEffects } from "./effects";
import { getGreeting, getSkyColors } from "./theme";
import type { WeatherKey } from "./types";

describe("toWeatherKey", () => {
  const cases: [number, WeatherKey][] = [
    [0, "clear"],
    [1, "few-clouds"],
    [2, "scattered-clouds"],
    [3, "overcast"],
    [45, "mist"],
    [48, "mist"],
    [51, "drizzle"],
    [53, "drizzle"],
    [55, "drizzle"],
    [56, "sleet"],
    [57, "sleet"],
    [61, "rain"],
    [63, "rain"],
    [65, "rain"],
    [66, "sleet"],
    [67, "sleet"],
    [71, "snow"],
    [73, "snow"],
    [75, "snow"],
    [77, "snow"],
    [80, "shower"],
    [81, "shower"],
    [82, "shower"],
    [85, "snow"],
    [86, "snow"],
    [95, "thunderstorm"],
    [96, "thunderstorm"],
    [99, "thunderstorm"],
  ];

  it.each(cases)("WMO 코드 %i는 %s로 분류한다", (code, expected) => {
    expect(toWeatherKey(code)).toBe(expected);
  });

  it.each([-1, 4, 44, 100, 999])("알 수 없는 코드 %i는 overcast", (code) => {
    expect(toWeatherKey(code)).toBe("overcast");
  });
});

describe("toTimeKey", () => {
  it.each([
    [3.99, "night"],
    [4, "dawn"],
    [6.99, "dawn"],
    [7, "morning"],
    [10.99, "morning"],
    [11, "noon"],
    [13.99, "noon"],
    [14, "afternoon"],
    [16.99, "afternoon"],
    [17, "evening"],
    [19.99, "evening"],
    [20, "night"],
    [0, "night"],
  ] as const)("%d시는 %s", (hour, expected) => {
    expect(toTimeKey(hour)).toBe(expected);
  });
});

describe("낮/밤 판단", () => {
  it("일출·일몰이 없으면 06:30–18:00을 낮으로 본다", () => {
    expect(isDaytime(6.4)).toBe(false);
    expect(isDaytime(6.5)).toBe(true);
    expect(isDaytime(17.99)).toBe(true);
    expect(isDaytime(18)).toBe(false);
  });

  it("unix seconds를 KST 시각으로 바꾼다", () => {
    // 2026-10-12 21:30:00 UTC = 2026-10-13 06:30:00 KST
    const sec = Date.UTC(2026, 9, 12, 21, 30) / 1000;
    expect(secToKstHour(sec)).toBeCloseTo(6.5);
  });

  it("날씨 응답의 일출·일몰이 있으면 그 값을 쓴다", () => {
    const sec = (utcHour: number) => Date.UTC(2026, 9, 12, utcHour) / 1000;
    const sun = getSunHours({
      sunrise: sec(21),
      sunset: sec(9),
    } as Parameters<typeof getSunHours>[0]);
    expect(sun).toEqual({ sunrise: 6, sunset: 18 });
  });
});

describe("Open-Meteo 응답 정규화", () => {
  const nowSec = Date.UTC(2026, 9, 13, 3) / 1000; // 10/13 12:00 KST
  const response: OpenMeteoResponse = {
    current: { temperature_2m: 14.6, weather_code: 63 },
    daily: {
      temperature_2m_max: [17.4],
      temperature_2m_min: [9.5],
      sunrise: [Date.UTC(2026, 9, 12, 21, 30) / 1000],
      sunset: [Date.UTC(2026, 9, 13, 9) / 1000],
    },
  };

  it("응답을 WeatherPayload로 정규화한다", () => {
    expect(buildWeatherPayload(response, nowSec)).toEqual({
      weather: "rain",
      weatherCode: 63,
      temp: 15,
      high: 17,
      low: 10,
      city: "서울",
      sunrise: response.daily.sunrise[0],
      sunset: response.daily.sunset[0],
      fetchedAt: nowSec,
    });
  });

  it("정규화한 일출·일몰은 KST 시각으로 바뀐다", () => {
    const sun = getSunHours(buildWeatherPayload(response, nowSec));
    expect(sun).toEqual({ sunrise: 6.5, sunset: 18 });
  });

  it("필요한 값이 없으면 예외를 던진다", () => {
    const broken = {
      ...response,
      daily: { ...response.daily, sunrise: [] },
    };
    expect(() => buildWeatherPayload(broken, nowSec)).toThrow("sunrise");
    expect(() =>
      buildWeatherPayload({} as OpenMeteoResponse, nowSec),
    ).toThrow();
  });
});

describe("테마", () => {
  it("clear는 어두운 시간대에 다른 안내 문구를 쓴다", () => {
    expect(getGreeting("noon", "clear")).toContain("햇살이 좋은 날이에요");
    expect(getGreeting("night", "clear")).toContain("하늘이 맑아요");
  });

  it("날씨를 모르면 인사말만 보여 준다", () => {
    expect(getGreeting("morning", null)).toBe("좋은 아침이에요");
  });

  it("clear는 하늘 톤을 바꾸지 않는다", () => {
    expect(getSkyColors("noon", "clear")[0]).toBe("rgb(28, 111, 209)");
  });

  it("효과 요소는 호출마다 같은 결과를 낸다(SSR/CSR 일치)", () => {
    expect(buildEffects("rain").drops[0]).toEqual(
      buildEffects("rain").drops[0],
    );
    expect(buildEffects("shower").drops).toHaveLength(140);
    expect(buildEffects("snow").flakes).toHaveLength(70);
    expect(buildEffects("clear").stars).toHaveLength(60);
  });
});
