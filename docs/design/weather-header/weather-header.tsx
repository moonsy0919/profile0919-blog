"use client";

import type { CSSProperties } from "react";
import { Noto_Sans_KR } from "next/font/google";
import { buildScene, getGlowStyle, type WeatherReport } from "./scene";
import {
  TIME_THEMES,
  getGreeting,
  getIconName,
  getSkyColors,
  getStarsOpacity,
} from "./theme";
import type { TimeKey, WeatherKey } from "./types";
import { useNow } from "./use-now";
import { useWeather } from "./use-weather";
import { WeatherEffects } from "./weather-effects";
import styles from "./weather-header.module.css";
import { WeatherIcon } from "./weather-icon";

const notoSansKr = Noto_Sans_KR({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-noto-sans-kr",
});

/** 마운트 전·값이 없을 때 높이를 유지하기 위한 공백 문자 */
const PLACEHOLDER = " ";

type TimeBlockProps = {
  timeLabel: string;
  date: string | null;
  clock: string | null;
  greeting: string;
};

/** 왼쪽: 시간대 칩 + 날짜, 시계, 인사말 */
function TimeBlock({ timeLabel, date, clock, greeting }: TimeBlockProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-center gap-2 text-sm font-medium text-white/90">
        <span className="rounded-full bg-white/[0.18] px-2.5 py-[3px] font-semibold">
          {timeLabel}
        </span>
        <span>{date ?? PLACEHOLDER}</span>
      </div>
      <div className="text-[clamp(40px,5.5vw,60px)] leading-[1.1] font-light tracking-[-0.01em]">
        {clock ?? PLACEHOLDER}
      </div>
      <div className="text-base font-medium text-white/[0.92]">{greeting}</div>
    </div>
  );
}

/** 날씨를 불러오는 동안 같은 크기로 자리를 잡아 두는 스켈레톤 */
function ReportSkeleton() {
  return (
    <div aria-hidden="true" className="flex items-center gap-4">
      <div className="size-[68px] rounded-full bg-white/20 motion-safe:animate-pulse" />
      <div className="flex flex-col gap-2 motion-safe:animate-pulse">
        <div className="h-10 w-24 rounded bg-white/20" />
        <div className="h-4 w-32 rounded bg-white/20" />
        <div className="h-3.5 w-28 rounded bg-white/20" />
      </div>
    </div>
  );
}

type ReportBlockProps = {
  report: WeatherReport;
  icon: ReturnType<typeof getIconName>;
};

/** 오른쪽: 날씨 아이콘, 기온, 날씨 · 도시, 최고/최저 */
function ReportBlock({ report, icon }: ReportBlockProps) {
  return (
    <div className="flex items-center gap-4">
      {icon && <WeatherIcon name={icon} />}
      <div className="flex flex-col gap-0.5">
        <div className="text-[clamp(40px,5vw,54px)] leading-none font-light">
          {report.temp}°
        </div>
        <div className="text-base font-semibold">
          {report.label} · {report.city}
        </div>
        <div className="text-sm font-medium text-white/[0.88]">
          최고 {report.high}° · 최저 {report.low}°
        </div>
      </div>
    </div>
  );
}

type WeatherHeaderProps = {
  /** 테스트용: API 대신 이 날씨를 사용한다. */
  forceWeather?: WeatherKey;
  /** 테스트용: 시계 대신 이 시간대(또는 시각 0~24)를 사용한다. */
  forceTime?: TimeKey | number;
};

/** 현재 시간대와 날씨에 따라 하늘·효과·문구가 바뀌는 페이지 헤더 */
export function WeatherHeader({ forceWeather, forceTime }: WeatherHeaderProps) {
  const nowMs = useNow();
  const { weather: payload, status } = useWeather(!forceWeather);
  const scene = buildScene({ nowMs, payload, forceWeather, forceTime });
  const [sky1, sky2, sky3] = getSkyColors(scene.timeKey, scene.weather);
  const skyVars = {
    "--sky-1": sky1,
    "--sky-2": sky2,
    "--sky-3": sky3,
  } as CSSProperties;
  const icon = getIconName(scene.weather, scene.night);
  const loading = !forceWeather && status === "loading";

  return (
    <header
      data-weather={scene.weather ?? undefined}
      data-time={scene.timeKey}
      style={{
        ...skyVars,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, var(--font-noto-sans-kr), 'Noto Sans KR', sans-serif",
      }}
      className={`${notoSansKr.variable} ${styles.sky} relative min-h-[200px] w-full overflow-hidden text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.22)]`}
    >
      <WeatherEffects
        weather={scene.weather}
        starsOpacity={getStarsOpacity(scene.timeKey, scene.weather)}
        glowStyle={getGlowStyle(scene)}
      />
      <div className="relative mx-auto box-border flex min-h-[200px] max-w-[1200px] flex-wrap items-center justify-between gap-x-10 gap-y-5 px-[clamp(20px,4vw,48px)] py-7">
        <TimeBlock
          timeLabel={TIME_THEMES[scene.timeKey].ko}
          date={scene.date}
          clock={scene.clock}
          greeting={getGreeting(scene.timeKey, scene.weather)}
        />
        {loading && <ReportSkeleton />}
        {scene.report && <ReportBlock report={scene.report} icon={icon} />}
      </div>
    </header>
  );
}
