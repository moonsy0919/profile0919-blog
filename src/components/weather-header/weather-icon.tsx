import type { ReactNode } from "react";
import type { IconName } from "./types";

/** 모든 구름 아이콘이 공유하는 구름 윤곽 */
const CLOUD =
  "M9 25.5h14.5a5.5 5.5 0 0 0 .4-11A7.5 7.5 0 0 0 9.6 15.2 5.2 5.2 0 0 0 9 25.5Z";

const stroke = {
  fill: "none",
  strokeLinecap: "round" as const,
};

const ICONS: Record<IconName, ReactNode> = {
  sun: (
    <>
      <circle cx="16" cy="16" r="6.5" fill="#FFD23F" />
      <path
        d="M16 3.5v3.5M16 25v3.5M3.5 16H7M25 16h3.5M7.2 7.2l2.5 2.5M22.3 22.3l2.5 2.5M7.2 24.8l2.5-2.5M22.3 9.7l2.5-2.5"
        stroke="#FFD23F"
        strokeWidth="2.2"
        {...stroke}
      />
    </>
  ),
  moon: (
    <path
      d="M20 4.5A11.5 11.5 0 1 0 27.5 20 9 9 0 0 1 20 4.5Z"
      fill="#EDEBDD"
    />
  ),
  partSun: (
    <>
      <circle cx="12" cy="12" r="5" fill="#FFD23F" />
      <path
        d="M12 3v2.5M3 12h2.5M5.6 5.6l1.8 1.8M18.4 5.6l-1.8 1.8"
        stroke="#FFD23F"
        strokeWidth="2"
        {...stroke}
      />
      <path d={CLOUD} transform="translate(3 3) scale(0.88)" fill="#FFFFFF" />
    </>
  ),
  partMoon: (
    <>
      <path
        d="M13 3.5A8 8 0 1 0 19.5 14 6.3 6.3 0 0 1 13 3.5Z"
        fill="#EDEBDD"
      />
      <path d={CLOUD} transform="translate(3 3) scale(0.88)" fill="#F2F5F9" />
    </>
  ),
  cloud: <path d={CLOUD} fill="#F2F5F9" />,
  clouds: (
    <>
      <path d={CLOUD} transform="translate(7 -3) scale(0.78)" fill="#AEB8C6" />
      <path d={CLOUD} transform="translate(-1.5 1)" fill="#DCE2EA" />
    </>
  ),
  fog: (
    <>
      <path d={CLOUD} transform="translate(0 -6)" fill="#E6ECF4" />
      <path
        d="M5 23.5h22M8.5 27.5h15"
        stroke="#E6ECF4"
        strokeWidth="2.2"
        {...stroke}
      />
    </>
  ),
  drizzle: (
    <>
      <path d={CLOUD} transform="translate(0 -4)" fill="#E6ECF4" />
      <path
        d="M11 24.5v1.4M16.5 26.5v1.4M22 24.5v1.4"
        stroke="#8FD8FF"
        strokeWidth="2.2"
        {...stroke}
      />
    </>
  ),
  rain: (
    <>
      <path d={CLOUD} transform="translate(0 -4)" fill="#E6ECF4" />
      <path
        d="M11 24.5l-1.6 3.5M16.5 24.5l-1.6 3.5M22 24.5l-1.6 3.5"
        stroke="#5AC8FA"
        strokeWidth="2.2"
        {...stroke}
      />
    </>
  ),
  shower: (
    <>
      <path d={CLOUD} transform="translate(0 -5)" fill="#D5DDE8" />
      <path
        d="M10 23l-2.2 5.5M14.5 23l-2.2 5.5M19 23l-2.2 5.5M23.5 23l-2.2 5.5"
        stroke="#5AC8FA"
        strokeWidth="2"
        {...stroke}
      />
    </>
  ),
  thunder: (
    <>
      <path d={CLOUD} transform="translate(0 -5)" fill="#C3CCD8" />
      <path d="M17 18.5l-4.5 6.5h3.5l-2 6 6-8h-3.6l2.1-4.5Z" fill="#FFD23F" />
    </>
  ),
  snow: (
    <>
      <path d={CLOUD} transform="translate(0 -4)" fill="#E6ECF4" />
      <circle cx="10.5" cy="26" r="1.6" fill="#FFFFFF" />
      <circle cx="16" cy="28.5" r="1.6" fill="#FFFFFF" />
      <circle cx="21.5" cy="26" r="1.6" fill="#FFFFFF" />
    </>
  ),
  sleet: (
    <>
      <path d={CLOUD} transform="translate(0 -4)" fill="#E6ECF4" />
      <path
        d="M11 24.5l-1.6 3.5M22 24.5l-1.6 3.5"
        stroke="#5AC8FA"
        strokeWidth="2.2"
        {...stroke}
      />
      <circle cx="16" cy="27" r="1.7" fill="#FFFFFF" />
    </>
  ),
};

type WeatherIconProps = { name: IconName; size?: number };

/** 날씨 아이콘 (장식용이므로 스크린리더에서는 숨긴다) */
export function WeatherIcon({ name, size = 68 }: WeatherIconProps) {
  return (
    <svg
      data-icon={name}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}
