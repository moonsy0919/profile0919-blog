import { expect, test } from "@playwright/test";
import { hasAdminSessionEnv, loginAsAdmin } from "./helpers/admin-session";
import { firstDevLogPath } from "./helpers/dev-log";

// 프로덕션 빌드(`next start`)에서만 의미가 있다: 쓰기가 더미인 동안은 관리자에게도 쓰기 UI를 보이지 않는다.
// 예: npm run build && npm run start -- -p 3200 → E2E_PROD_BUILD=1 E2E_PORT=3200 npx playwright test dev-log-prod-gate
// Task 022(개발 일기 쓰기 실연동)에서 게이트를 풀 때 이 스펙도 함께 정리한다.
test.skip(
  !process.env.E2E_PROD_BUILD,
  "프로덕션 빌드 서버를 띄운 로컬 실행 전용",
);
test.skip(
  !hasAdminSessionEnv(),
  "관리자 세션 주입용 환경 변수(.env.local)가 필요합니다",
);

test("프로덕션에서는 관리자에게도 [게시]·[수정]·[삭제]가 보이지 않는다", async ({
  page,
  context,
}) => {
  await loginAsAdmin(context);

  await page.goto("/");
  await expect(
    page.locator("section[aria-labelledby='dev-log-heading'] article"),
  ).toHaveCount(4);
  await page.goto("/dev-logs");
  await expect(
    page.getByRole("link", { name: "게시", exact: true }),
  ).toHaveCount(0);

  await page.goto(await firstDevLogPath(page));
  await expect(page.getByRole("link", { name: "수정" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "삭제" })).toHaveCount(0);
});
