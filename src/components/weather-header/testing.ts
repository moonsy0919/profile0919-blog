import { vi } from "vitest";

/**
 * jsdom에 없는 window.matchMedia를 흉내 낸다.
 * @param matching 쿼리 문자열을 받아 일치 여부를 돌려주는 함수
 */
export function mockMatchMedia(matching: (query: string) => boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: matching(query),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

type ObserverCallback = (entries: { isIntersecting: boolean }[]) => void;

/** 테스트에서 화면 안/밖을 직접 바꿀 수 있는 IntersectionObserver 대역 */
export function mockIntersectionObserver() {
  const callbacks: ObserverCallback[] = [];
  class FakeObserver {
    constructor(callback: ObserverCallback) {
      callbacks.push(callback);
    }
    observe() {}
    disconnect() {}
  }
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  return {
    /** 모든 관찰자에게 화면 안(true)/밖(false)을 알린다. act 안에서 호출한다. */
    notify(isIntersecting: boolean) {
      callbacks.forEach((callback) => callback([{ isIntersecting }]));
    },
  };
}
