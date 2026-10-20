"use client";

import { createContext, useContext } from "react";
import type { Scene } from "./scene";

/** 하늘 배경과 정보 영역이 함께 쓰는 값 */
export type WeatherSceneValue = {
  scene: Scene;
  /** 날씨 API 응답을 기다리는 중인지 (forceWeather 사용 시 항상 false) */
  loading: boolean;
};

export const WeatherSceneContext = createContext<WeatherSceneValue | null>(
  null,
);

/** 하늘 배경과 정보 영역이 같은 장면 값을 읽는 훅. WeatherScene 안에서만 쓴다. */
export function useWeatherScene(): WeatherSceneValue {
  const value = useContext(WeatherSceneContext);
  if (!value) throw new Error("WeatherScene 안에서만 사용할 수 있습니다.");
  return value;
}
