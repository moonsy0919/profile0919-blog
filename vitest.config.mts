import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfig.json의 paths(@/*)를 Vite가 직접 해석한다.
  resolve: {
    tsconfigPaths: true,
    // server-only는 서버 번들 조건이 없으면 던지므로 테스트에서는 빈 모듈로 바꾼다.
    alias: {
      "server-only": fileURLToPath(
        new URL("./vitest.server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // E2E 테스트(e2e/)는 Playwright가 실행하므로 제외한다.
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
