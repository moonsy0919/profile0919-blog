"use client";

import { scrimBottomAlpha, scrimGradient } from "./contrast";
import { getGlowStyle } from "./scene";
import { getSkyColors, getStarsOpacity } from "./theme";
import { useWeatherScene } from "./scene-context";
import { useIsMobile, usePrefersReducedMotion } from "./use-media-query";

/** 모바일(640px 이하)에서 빗방울·눈송이 개수에 곱하는 배율 */
const MOBILE_PARTICLE_SCALE = 0.5;
import { WeatherEffects } from "./weather-effects";

/**
 * 하늘 위에 깔리는 효과(별·해 광채·구름·안개·번개·비·눈)와 글자 대비용 어둠 막.
 * 배경 그라디언트는 WeatherScene 루트가 그린다. 모든 레이어가 aria-hidden이고 포인터 이벤트를 받지 않는다.
 */
export function SkyBackground() {
  const { scene } = useWeatherScene();
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const alpha = scrimBottomAlpha(getSkyColors(scene.timeKey, scene.weather));
  return (
    <>
      <WeatherEffects
        weather={scene.weather}
        still={reducedMotion}
        particleScale={isMobile ? MOBILE_PARTICLE_SCALE : 1}
        starsOpacity={getStarsOpacity(scene.timeKey, scene.weather)}
        glowStyle={getGlowStyle(scene)}
      />
      <div
        aria-hidden="true"
        data-sky-scrim
        className="pointer-events-none absolute inset-0"
        style={{ background: scrimGradient(alpha) }}
      />
    </>
  );
}
