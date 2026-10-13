import type { CSSProperties, ReactNode } from "react";
import {
  buildEffects,
  type Cloud,
  type Drop,
  type DropSpec,
  type Flake,
  type FogBand,
  type Star,
} from "./effects";
import { getWeatherTheme } from "./theme";
import type { WeatherKey } from "./types";
import styles from "./weather-header.module.css";

/** CSS 변수를 style에 넣을 수 있게 하는 타입 헬퍼 */
type VarStyle = CSSProperties & Record<`--${string}`, string | number>;

/** 헤더 전체를 덮는, 클릭을 막지 않는 장식 레이어 */
function Layer({
  style,
  className = "",
  children,
}: {
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

function Stars({ stars, opacity }: { stars: Star[]; opacity: number }) {
  return (
    <Layer className={styles.fade} style={{ opacity }}>
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
          }}
        />
      ))}
    </Layer>
  );
}

function Glow({ style, opacity }: { style: CSSProperties; opacity: number }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute -mt-[130px] -ml-[130px] size-[260px] rounded-full ${styles.fade}`}
      style={{ ...style, opacity }}
    />
  );
}

function Clouds({ clouds, dim }: { clouds: Cloud[]; dim: boolean }) {
  const tint = dim ? "rgba(170, 180, 198, " : "rgba(255, 255, 255, ";
  return (
    <Layer>
      {clouds.map((c, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-[26px]"
          style={{
            left: `${c.left}%`,
            top: c.top,
            width: `${c.width}%`,
            height: c.height,
            background: `${tint}${c.alpha})`,
          }}
        />
      ))}
    </Layer>
  );
}

function Fog({ bands }: { bands: FogBand[] }) {
  return (
    <Layer>
      {bands.map((f, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-[rgba(236,240,246,0.24)] blur-[16px]"
          style={{
            left: `${f.left}%`,
            top: f.top,
            width: `${f.width}%`,
            height: f.height,
          }}
        />
      ))}
    </Layer>
  );
}

function Lightning() {
  return (
    <>
      <Layer className={`bg-[#E9E6FF] ${styles.flashScreen}`} />
      <svg
        aria-hidden="true"
        width="70"
        height="150"
        viewBox="0 0 70 150"
        className="pointer-events-none absolute top-0 left-[58%]"
      >
        <path
          d="M40 0 22 62h16L18 150 52 50H36L48 0Z"
          fill="#FFF6C8"
          className={styles.flashBolt}
        />
      </svg>
    </>
  );
}

function Drops({ drops, spec }: { drops: Drop[]; spec: DropSpec }) {
  return (
    <Layer>
      {drops.map((d, i) => (
        <svg
          key={i}
          width="4"
          height="200"
          viewBox="0 0 4 200"
          className="absolute top-0 overflow-visible"
          style={{ left: `${d.left}%` }}
        >
          <line
            x1="2"
            y1="0"
            x2={d.x2}
            y2={d.len}
            stroke={spec.stroke}
            strokeWidth={spec.strokeWidth}
            strokeLinecap="round"
            className={styles.drop}
            style={
              {
                "--dur": `${d.dur}s`,
                "--delay": `${d.delay}s`,
                "--from-x": `${d.fromX}px`,
                "--to-x": `${d.toX}px`,
              } as VarStyle
            }
          />
        </svg>
      ))}
    </Layer>
  );
}

function Flakes({ flakes }: { flakes: Flake[] }) {
  return (
    <Layer>
      {flakes.map((f, i) => (
        <svg
          key={i}
          width="8"
          height="200"
          viewBox="0 0 8 200"
          className="absolute top-0 overflow-visible"
          style={{ left: `${f.left}%` }}
        >
          <circle
            cx="4"
            cy="0"
            r={f.r}
            fill="rgba(255, 255, 255, 0.9)"
            className={styles.flake}
            style={
              {
                "--dur": `${f.dur}s`,
                "--delay": `${f.delay}s`,
                "--to-x": `${f.toX}px`,
              } as VarStyle
            }
          />
        </svg>
      ))}
    </Layer>
  );
}

type WeatherEffectsProps = {
  weather: WeatherKey | null;
  starsOpacity: number;
  glowStyle: CSSProperties | null;
};

/** 날씨에 따른 배경 효과(별·광채·구름·안개·번개·비·눈) 묶음 */
export function WeatherEffects({
  weather,
  starsOpacity,
  glowStyle,
}: WeatherEffectsProps) {
  const theme = getWeatherTheme(weather);
  const fx = buildEffects(weather);
  return (
    <>
      <Stars stars={fx.stars} opacity={starsOpacity} />
      {glowStyle && <Glow style={glowStyle} opacity={theme.glow} />}
      <Clouds clouds={fx.clouds} dim={!!theme.dim} />
      <Fog bands={fx.fog} />
      {theme.flash && <Lightning />}
      {fx.dropSpec && <Drops drops={fx.drops} spec={fx.dropSpec} />}
      <Flakes flakes={fx.flakes} />
    </>
  );
}
