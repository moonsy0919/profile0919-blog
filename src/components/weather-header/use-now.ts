import { useCallback, useSyncExternalStore } from "react";

const TICK_MS = 20_000;

/** 20초 경계(분 경계와 정렬됨)마다 구독자를 깨운다. */
function subscribeTicks(onChange: () => void) {
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

/** 아무것도 구독하지 않는다(일시정지 중). */
function subscribeNothing() {
  return () => {};
}

/**
 * 20초마다 갱신되는 현재 시각(ms). 마운트 전에는 null.
 * @param enabled false면 갱신을 멈춘다(탭 숨김·화면 밖). 다시 true가 되면 최신 시각으로 바로 갱신된다.
 */
export function useNow(enabled = true): number | null {
  const subscribe = useCallback(
    (onChange: () => void) =>
      enabled ? subscribeTicks(onChange) : subscribeNothing(),
    [enabled],
  );
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
