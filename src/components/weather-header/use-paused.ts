import {
  useEffect,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";

/** 탭이 숨겨졌는지 구독한다. 서버에서는 false. */
function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

/** 요소가 화면 안에 있는지. IntersectionObserver가 없으면 항상 true. */
function useInView(ref: RefObject<Element | null>): boolean {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry.isIntersecting),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
}

/**
 * 탭이 숨겨졌거나 요소가 화면 밖이면 true. 이때 입자 애니메이션과 시계 갱신을 멈춰 CPU를 아낀다.
 * @param ref 화면 안 여부를 관찰할 요소
 */
export function usePaused(ref: RefObject<Element | null>): boolean {
  const hidden = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "hidden",
    () => false,
  );
  const inView = useInView(ref);
  return hidden || !inView;
}
