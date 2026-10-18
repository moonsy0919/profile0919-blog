import {
  TIME_KEYS,
  TIME_THEMES,
  WEATHER_KEYS,
  WEATHER_THEMES,
} from "@/components/weather-header/theme";
import { WeatherHeader } from "@/components/weather-header/weather-header";

/**
 * 개발 환경 전용: 날씨 11종 × 시간대 6종 = 66개 조합을 한 화면에서 확인한다.
 * 프로덕션 차단은 (dev)/layout.tsx의 assertDevOnly()가, <main>은 PageShell이 맡는다.
 */
export default function WeatherHeaderPreviewPage() {
  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-10 px-4 py-8">
      <h1 className="text-2xl font-semibold">날씨 헤더 미리보기 (11 × 6)</h1>
      {WEATHER_KEYS.map((weather) => (
        <section key={weather} aria-labelledby={`w-${weather}`}>
          <h2 id={`w-${weather}`} className="mb-3 text-lg font-semibold">
            {WEATHER_THEMES[weather].ko}{" "}
            <code className="text-sm font-normal text-muted-foreground">
              {weather}
            </code>
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {TIME_KEYS.map((time) => (
              <figure key={time} className="overflow-hidden rounded-lg">
                <figcaption className="bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {TIME_THEMES[time].ko} · {time}
                </figcaption>
                <WeatherHeader forceWeather={weather} forceTime={time} />
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
