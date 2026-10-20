"use client";

import { useRef, type CSSProperties } from "react";
import { Noto_Sans_KR } from "next/font/google";
import { WeatherSceneContext } from "./scene-context";
import { SkyBackground } from "./sky-background";
import { buildScene } from "./scene";
import { getSkyColors } from "./theme";
import type { TimeKey, WeatherKey } from "./types";
import { useNow } from "./use-now";
import { usePaused } from "./use-paused";
import { useWeather } from "./use-weather";
import styles from "./weather-header.module.css";

const notoSansKr = Noto_Sans_KR({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-noto-sans-kr",
});

type WeatherSceneProps = {
  /** 테스트용: API 대신 이 날씨를 사용한다. */
  forceWeather?: WeatherKey;
  /** 테스트용: 시계 대신 이 시간대(또는 시각 0~24)를 사용한다. */
  forceTime?: TimeKey | number;
  className?: string;
  children: React.ReactNode;
};

/**
 * 현재 시각·날씨로 장면을 한 번만 계산해 하늘 배경(SkyBackground)과 children(정보 영역 등)에 나눠 준다.
 * 루트는 header가 아니라 div라서 페이지의 header 위에 얹어 쓸 수 있다.
 */
export function WeatherScene({
  forceWeather,
  forceTime,
  className = "",
  children,
}: WeatherSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const paused = usePaused(rootRef);
  const nowMs = useNow(!paused);
  const { weather: payload, status } = useWeather(!forceWeather);
  const scene = buildScene({ nowMs, payload, forceWeather, forceTime });
  const [sky1, sky2, sky3] = getSkyColors(scene.timeKey, scene.weather);
  const skyVars = {
    "--sky-1": sky1,
    "--sky-2": sky2,
    "--sky-3": sky3,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, var(--font-noto-sans-kr), 'Noto Sans KR', sans-serif",
  } as CSSProperties;
  const value = { scene, loading: !forceWeather && status === "loading" };

  return (
    <WeatherSceneContext.Provider value={value}>
      <div
        ref={rootRef}
        data-paused={paused}
        data-weather={scene.weather ?? undefined}
        data-time={scene.timeKey}
        style={skyVars}
        className={`${notoSansKr.variable} ${styles.sky} relative w-full overflow-hidden text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.22)] ${className}`}
      >
        <SkyBackground />
        <div className="relative">{children}</div>
      </div>
    </WeatherSceneContext.Provider>
  );
}
