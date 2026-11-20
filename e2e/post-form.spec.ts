import { expect, test, type BrowserContext } from "@playwright/test";
import { hasAdminSessionEnv, loginAsAdmin } from "./helpers/admin-session";

// 작성·수정 폼은 더미 게이트라 프로덕션(CI는 프로덕션 빌드)에서는 404다. 개발 서버에서만 검증한다.
test.skip(Boolean(process.env.CI), "더미 기반 화면은 로컬 개발 서버 전용");
test.skip(
  !hasAdminSessionEnv(),
  "관리자 세션 주입용 환경 변수(.env.local)가 필요합니다",
);

const POST = "/posts/hello-world";
const DEV_LOG = "/dev-logs/devlog-01";

/** 관리자로 로그인한 상태로 만든다 */
async function asAdmin(context: BrowserContext) {
  await loginAsAdmin(context);
}

test.describe("게시글 수정 모드", () => {
  test.beforeEach(async ({ context }) => asAdmin(context));

  test("기존 값이 채워진 채 열리고 slug 변경 경고를 보인다", async ({
    page,
  }) => {
    await page.goto(`${POST}?edit=1`);
    await expect(page.getByLabel("slug")).toHaveValue("hello-world");
    await expect(page.getByLabel("제목")).not.toHaveValue("");
    await expect(page.getByLabel("본문")).not.toHaveValue("");
    await page.getByLabel("slug").fill("renamed");
    await expect(page.getByRole("status")).toContainText("/posts/hello-world");
  });

  test("[취소]는 edit만 제거하고 page를 유지한 읽기 모드로 돌아간다", async ({
    page,
  }) => {
    await page.goto(`${POST}?page=2&edit=1`);
    await page.getByRole("button", { name: "취소" }).click();
    await expect(page).toHaveURL(/\/posts\/hello-world\?page=2$/);
  });

  test("읽기 모드와 수정 모드의 컨테이너 폭·제목 위치가 같다", async ({
    page,
  }) => {
    await page.goto(POST);
    const read = await page.locator("main article > div").boundingBox();
    await page.goto(`${POST}?edit=1`);
    const edit = await page.locator("main section > div").boundingBox();
    expect(edit?.x).toBe(read?.x);
    expect(edit?.width).toBe(read?.width);
  });
});

test.describe("개발 일기 게시·수정", () => {
  test("수정 모드는 기존 값으로 열리고 [취소]는 page를 유지한다", async ({
    page,
    context,
  }) => {
    await asAdmin(context);
    await page.goto(`${DEV_LOG}?page=2&edit=1`);
    await expect(page.getByLabel("제목")).not.toHaveValue("");
    await page.getByRole("button", { name: "취소" }).click();
    await expect(page).toHaveURL(/\/dev-logs\/devlog-01\?page=2$/);
  });
});
