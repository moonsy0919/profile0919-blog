import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);
// 다른 프로젝트의 개발 서버(3000)와 충돌하지 않도록 E2E 전용 포트를 사용한다.
const port = 3100;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // CI에서는 프로덕션 빌드로, 로컬에서는 개발 서버로 테스트한다.
  webServer: {
    command: isCI
      ? `npm run build && npm run start -- -p ${port}`
      : `npm run dev -- -p ${port}`,
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
