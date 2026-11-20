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

test.describe("게시글 작성", () => {
  test("제목·본문이 비어 있으면 [저장]이 비활성이고, 채우면 활성이다", async ({
    page,
  }) => {
    await page.goto("/posts/new");
    const save = page.getByRole("button", { name: "저장" });
    await expect(save).toBeDisabled();
    await page.getByLabel("제목").fill("E2E Post");
    await page.getByLabel("본문").fill("내용");
    await expect(save).toBeEnabled();
    await expect(page.getByLabel("slug")).toHaveValue("e2e-post");
  });

  test("미리보기 탭이 마크다운을 렌더한다", async ({ page }) => {
    await page.goto("/posts/new");
    await page.getByLabel("본문").fill("**굵게**");
    await page.getByRole("tab", { name: "미리보기" }).click();
    await expect(page.locator("strong", { hasText: "굵게" })).toBeVisible();
  });

  test("변경 후 [취소]는 이탈 확인을 거쳐 메인으로 간다", async ({ page }) => {
    await page.goto("/posts/new");
    await page.getByLabel("제목").fill("바꿈");
    await page.getByRole("button", { name: "취소" }).click();
    await expect(page.getByText("저장하지 않고 나갈까요?")).toBeVisible();
    await page.getByRole("button", { name: "나가기" }).click();
    await expect(page).toHaveURL("/");
  });

  test("새 태그를 추가하면 칩으로 선택된다", async ({ page }) => {
    await page.goto("/posts/new");
    await page.getByRole("combobox").fill("Vitest");
    await page.getByRole("button", { name: "추가" }).click();
    await expect(page.getByLabel("Vitest 태그 제거")).toBeVisible();
  });
});

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
  test("게시 폼에는 slug가 없고 GitHub URL 형식 오류를 보인다", async ({
    page,
  }) => {
    await page.goto("/dev-logs/new");
    await expect(page.getByLabel("slug")).toHaveCount(0);
    await page.getByLabel("제목").fill("일기");
    await page.getByLabel("본문").fill("내용");
    await page.getByLabel("GitHub URL (선택)").fill("https://example.com/x");
    await page.getByRole("button", { name: "게시" }).click();
    await expect(
      page.getByText("https://github.com/ 로 시작하는 주소를 입력해 주세요"),
    ).toBeVisible();
  });

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
