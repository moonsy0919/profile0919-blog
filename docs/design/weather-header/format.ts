import type { KstParts } from "./classify";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

/** 시·분을 "오전 2:21" 형식으로 만든다. */
export function formatClock(hour: number, minute: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const meridiem = hour < 12 ? "오전" : "오후";
  return `${meridiem} ${h12}:${String(minute).padStart(2, "0")}`;
}

/** 소수 시각(예: 9.5)을 시계 문자열로 만든다. */
export function formatClockFromHour(hourFloat: number): string {
  const hour = Math.floor(hourFloat);
  const minute = Math.round((hourFloat - hour) * 60) % 60;
  return formatClock(hour, minute);
}

/** KST 날짜를 "10월 13일 화요일" 형식으로 만든다. */
export function formatKstDate(parts: KstParts): string {
  return `${parts.month}월 ${parts.day}일 ${DAY_NAMES[parts.weekday]}요일`;
}
