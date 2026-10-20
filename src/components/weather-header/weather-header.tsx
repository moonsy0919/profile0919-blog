"use client";

import type { TimeKey, WeatherKey } from "./types";
import { WeatherInfo } from "./weather-info";
import { WeatherScene } from "./weather-scene";

type WeatherHeaderProps = {
  /** 테스트용: API 대신 이 날씨를 사용한다. */
  forceWeather?: WeatherKey;
  /** 테스트용: 시계 대신 이 시간대(또는 시각 0~24)를 사용한다. */
  forceTime?: TimeKey | number;
};

/**
 * 하늘 배경과 시계·날씨 정보를 합친 독립 영역(개발용 미리보기에서 쓴다).
 * 실제 헤더는 WeatherScene 안에 상단 바와 WeatherInfo를 직접 조합한다. header 태그는 쓰지 않는다.
 */
export function WeatherHeader({ forceWeather, forceTime }: WeatherHeaderProps) {
  return (
    <WeatherScene
      forceWeather={forceWeather}
      forceTime={forceTime}
      className="min-h-[200px]"
    >
      <WeatherInfo className="min-h-[200px] py-7" />
    </WeatherScene>
  );
}
