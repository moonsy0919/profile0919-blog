import { useSyncExternalStore } from "react";

const TICK_MS = 20_000;

/** 20초 경계(분 경계와 정렬됨)마다 구독자를 깨운다. */
function subscribe(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  const schedule = () => {
    timer = setTimeout(
      () => {
        onChange();
        schedule();
      },
      TICK_MS - (Date.now() % TICK_MS) + 5,
    );
  };
  schedule();
  return () => clearTimeout(timer);
}

function getSnapshot(): number {
  return Math.floor(Date.now() / TICK_MS) * TICK_MS;
}

/** 서버·하이드레이션 중에는 null: 시계가 마운트 이후에만 렌더되게 한다. */
function getServerSnapshot(): null {
  return null;
}

/** 20초마다 갱신되는 현재 시각(ms). 마운트 전에는 null. */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
