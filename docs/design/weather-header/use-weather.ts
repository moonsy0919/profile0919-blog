import { useEffect, useState } from "react";
import type { WeatherPayload } from "./types";

const POLL_MS = 10 * 60 * 1000;

export type WeatherStatus = "idle" | "loading" | "ready" | "error";
export type WeatherState = {
  weather: WeatherPayload | null;
  status: WeatherStatus;
};

const IDLE_STATE: WeatherState = { weather: null, status: "idle" };

/** /api/weather를 한 번 호출한다. 실패하면 예외를 던진다. */
async function requestWeather(signal: AbortSignal): Promise<WeatherPayload> {
  const res = await fetch("/api/weather", { signal });
  if (!res.ok) throw new Error(`weather ${res.status}`);
  return (await res.json()) as WeatherPayload;
}

/**
 * 날씨를 10분마다 폴링한다. 탭이 숨겨지면 멈추고 다시 보이면 즉시 갱신한다.
 * enabled가 false면 요청하지 않는다(forceWeather 사용 시).
 */
export function useWeather(enabled = true): WeatherState {
  const [state, setState] = useState<WeatherState>({
    weather: null,
    status: "loading",
  });

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setInterval> | undefined;

    const load = async () => {
      try {
        const weather = await requestWeather(controller.signal);
        setState({ weather, status: "ready" });
      } catch {
        if (controller.signal.aborted) return;
        // 실패해도 이전에 받은 값은 유지한다.
        setState((prev) => ({ weather: prev.weather, status: "error" }));
      }
    };
    const start = () => {
      void load();
      timer = setInterval(load, POLL_MS);
    };
    const stop = () => clearInterval(timer);
    const onVisibility = () => {
      stop();
      if (document.visibilityState === "visible") start();
    };

    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      controller.abort();
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled]);

  return enabled ? state : IDLE_STATE;
}
