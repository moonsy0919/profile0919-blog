import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfig.json의 paths(@/*)를 Vite가 직접 해석한다.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // E2E 테스트(e2e/)는 Playwright가 실행하므로 제외한다.
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
