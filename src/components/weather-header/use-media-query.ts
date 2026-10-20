import { useCallback, useSyncExternalStore } from "react";

/**
 * 미디어 쿼리 일치 여부를 구독한다. 서버·하이드레이션 중에는 false라서 서버와 첫 렌더가 같고,
 * 마운트 이후 실제 값으로 바뀐다(use-now.ts와 같은 방식).
 * @param query 예: "(prefers-reduced-motion: reduce)"
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** 사용자가 "움직임 줄이기"를 켰는지 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** 모바일(폭 640px 이하)인지. 입자 개수를 줄이는 데 쓴다. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 640px)");
}
