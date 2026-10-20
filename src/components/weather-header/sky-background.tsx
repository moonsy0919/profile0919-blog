"use client";

import { getGlowStyle } from "./scene";
import { getStarsOpacity } from "./theme";
import { useWeatherScene } from "./scene-context";
import { WeatherEffects } from "./weather-effects";

/**
 * 하늘 위에 깔리는 효과(별·해 광채·구름·안개·번개·비·눈). 배경 그라디언트는 WeatherScene 루트가 그린다.
 * 모든 레이어가 aria-hidden이고 포인터 이벤트를 받지 않는다.
 */
export function SkyBackground() {
  const { scene } = useWeatherScene();
  return (
    <WeatherEffects
      weather={scene.weather}
      starsOpacity={getStarsOpacity(scene.timeKey, scene.weather)}
      glowStyle={getGlowStyle(scene)}
    />
  );
}
