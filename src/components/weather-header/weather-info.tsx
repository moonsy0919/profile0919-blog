"use client";

import type { WeatherReport } from "./scene";
import { useWeatherScene } from "./scene-context";
import { TIME_THEMES, getGreeting, getIconName } from "./theme";
import { WeatherIcon } from "./weather-icon";

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

/**
 * 시계·날씨 정보 영역: 왼쪽 시간대 칩·날짜·시계·인사말, 오른쪽 날씨 요약.
 * WeatherScene 안에서 같은 장면 값을 읽는다. 날씨를 기다리는 동안은 스켈레톤으로 같은 크기의 자리를 잡는다.
 * @param className 높이·세로 패딩 등 바깥에서 정하는 클래스
 */
export function WeatherInfo({ className = "" }: { className?: string }) {
  const { scene, loading } = useWeatherScene();
  const icon = getIconName(scene.weather, scene.night);

  return (
    <div
      className={`relative mx-auto box-border flex max-w-[1200px] flex-wrap items-center justify-between gap-x-10 gap-y-5 px-[clamp(20px,4vw,48px)] ${className}`}
    >
      <TimeBlock
        timeLabel={TIME_THEMES[scene.timeKey].ko}
        date={scene.date}
        clock={scene.clock}
        greeting={getGreeting(scene.timeKey, scene.weather)}
      />
      {loading && <ReportSkeleton />}
      {scene.report && <ReportBlock report={scene.report} icon={icon} />}
    </div>
  );
}
