import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockIntersectionObserver, mockMatchMedia } from "./testing";
import { TIME_KEYS, WEATHER_KEYS } from "./theme";
import type { WeatherPayload } from "./types";
import { WeatherHeader } from "./weather-header";

vi.mock("next/font/google", () => ({
  Noto_Sans_KR: () => ({ variable: "font-noto" }),
}));

const REDUCED = "(prefers-reduced-motion: reduce)";
const MOBILE = "(max-width: 640px)";

const payload: WeatherPayload = {
  weather: "clear",
  weatherCode: 0,
  temp: 21,
  high: 25,
  low: 13,
  city: "서울",
  sunrise: 1_760_000_000,
  sunset: 1_760_040_000,
  fetchedAt: 1_760_000_000,
};

/** 렌더된 장면 루트(data-weather를 가진 div) */
function getScene(container: HTMLElement): HTMLElement {
  return container.querySelector("[data-time]") as HTMLElement;
}

/** 입자(빗방울·눈송이) 요소 수 */
function countParticles(container: HTMLElement): number {
  return container.querySelectorAll("line, circle[data-flake], g[data-flake]")
    .length;
}

beforeEach(() => {
  mockMatchMedia(() => false);
  mockIntersectionObserver();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => payload })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WeatherHeader 66개 조합", () => {
  const combos = WEATHER_KEYS.flatMap((w) =>
    TIME_KEYS.map((t) => [w, t] as const),
  );

  it.each(combos)("%s / %s 의 data 속성과 구조", (weather, time) => {
    const { container } = render(
      <WeatherHeader forceWeather={weather} forceTime={time} />,
    );
    const scene = getScene(container);
    expect(scene.getAttribute("data-weather")).toBe(weather);
    expect(scene.getAttribute("data-time")).toBe(time);
    expect(container.querySelectorAll("header").length).toBe(0);
    expect(container.querySelector("[data-sky-scrim]")).not.toBeNull();
  });
});

describe("WeatherHeader 데이터 상태", () => {
  it("마운트 전(서버 렌더)에는 시계 자리와 날씨 스켈레톤으로 높이를 유지한다", () => {
    const html = renderToString(<WeatherHeader />);
    expect(html).toContain('data-time="noon"');
    expect(html).not.toContain("서울");
    expect(html).toContain("animate-pulse");
  });

  it("날씨 응답을 받으면 기온·도시·최고/최저를 보여 준다", async () => {
    render(<WeatherHeader />);
    await act(async () => {});
    expect(screen.getByText("21°")).toBeTruthy();
    expect(screen.getByText(/맑음 · 서울/)).toBeTruthy();
    expect(screen.getByText(/최고 25° · 최저 13°/)).toBeTruthy();
  });

  it("날씨 API가 실패하면 시간대만 반영하고 날씨 영역은 비운다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 502 })),
    );
    const { container } = render(<WeatherHeader />);
    await act(async () => {});
    expect(getScene(container).hasAttribute("data-weather")).toBe(false);
    expect(screen.queryByText(/서울/)).toBeNull();
    expect(container.querySelector(".animate-pulse")).toBeNull();
  });

  it("forceWeather를 쓰면 날씨 API를 호출하지 않는다", () => {
    render(<WeatherHeader forceWeather="rain" forceTime="noon" />);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("WeatherHeader 보강", () => {
  it("일반 환경에서는 소나기 입자가 140개다", () => {
    const { container } = render(
      <WeatherHeader forceWeather="shower" forceTime="noon" />,
    );
    expect(container.querySelectorAll("line").length).toBe(140);
  });

  it("움직임 줄이기에서는 번개·비·눈 입자를 렌더링하지 않는다", () => {
    // 대조군: 일반 환경에서는 번개 요소가 실제로 선택된다(선택자가 헛돌지 않는지 확인).
    const normal = render(
      <WeatherHeader forceWeather="thunderstorm" forceTime="noon" />,
    );
    expect(normal.container.querySelector("[class*='flash']")).not.toBeNull();
    normal.unmount();

    mockMatchMedia((query) => query === REDUCED);
    const shower = render(
      <WeatherHeader forceWeather="shower" forceTime="noon" />,
    );
    expect(shower.container.querySelectorAll("line").length).toBe(0);
    shower.unmount();

    const snow = render(<WeatherHeader forceWeather="snow" forceTime="noon" />);
    expect(countParticles(snow.container)).toBe(0);
    snow.unmount();

    const storm = render(
      <WeatherHeader forceWeather="thunderstorm" forceTime="noon" />,
    );
    expect(storm.container.querySelector("[class*='flash']")).toBeNull();
  });

  it("모바일(640px 이하)에서는 소나기 입자가 절반(70개)이다", () => {
    mockMatchMedia((query) => query === MOBILE);
    const { container } = render(
      <WeatherHeader forceWeather="shower" forceTime="noon" />,
    );
    expect(container.querySelectorAll("line").length).toBe(70);
  });

  it("화면 밖이면 일시정지하고 돌아오면 재개한다", () => {
    const observer = mockIntersectionObserver();
    const { container } = render(
      <WeatherHeader forceWeather="rain" forceTime="noon" />,
    );
    const scene = getScene(container);
    expect(scene.getAttribute("data-paused")).toBe("false");

    act(() => observer.notify(false));
    expect(scene.getAttribute("data-paused")).toBe("true");

    act(() => observer.notify(true));
    expect(scene.getAttribute("data-paused")).toBe("false");
  });

  it("탭이 숨겨지면 일시정지한다", () => {
    const { container } = render(
      <WeatherHeader forceWeather="rain" forceTime="noon" />,
    );
    const scene = getScene(container);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(scene.getAttribute("data-paused")).toBe("true");
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(scene.getAttribute("data-paused")).toBe("false");
  });
});
