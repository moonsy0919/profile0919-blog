import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// 각 테스트가 끝나면 렌더링된 DOM을 정리한다.
afterEach(() => {
  cleanup();
});
