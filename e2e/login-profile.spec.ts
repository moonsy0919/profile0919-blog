import { expect, test } from "@playwright/test";
import { hasAdminSessionEnv, loginAsAdmin } from "./helpers/admin-session";

// /login은 프로덕션에 열려 있어 CI에서도 검증한다. 실제 로그인·세션은 auth.spec.ts(로컬 전용)가 맡는다.

test.describe("로그인 페이지", () => {
  test("빈 제출은 아이디·비밀번호 필드에 오류를 보인다", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(
      page.getByText("아이디(이메일)를 입력해 주세요"),
    ).toBeVisible();
    await expect(page.getByText("비밀번호를 입력해 주세요")).toBeVisible();
  });

  test("이메일 형식이 틀리면 형식 오류를 보인다", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("아이디(이메일)").fill("admin");
    await page.getByLabel("비밀번호").fill("pw");
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(
      page.getByText("올바른 이메일 형식으로 입력해 주세요"),
    ).toBeVisible();
  });

  test("비밀번호는 마스킹되고 가입·찾기 링크가 없다", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("비밀번호")).toHaveAttribute(
      "type",
      "password",
    );
    await expect(page.getByRole("main").getByRole("link")).toHaveCount(0);
  });

  test("next 쿼리가 있으면 로그인 필요 안내를 보인다", async ({ page }) => {
    await page.goto("/login?next=/profile/edit");
    await expect(page.getByText("관리자 로그인이 필요합니다")).toBeVisible();
  });
});

test.describe("프로필 수정 페이지", () => {
  // 프로필 수정은 더미 게이트라 프로덕션(CI)에서는 404이고, 관리자 로그인이 필요하다. 로컬 개발 서버 전용
  test.skip(Boolean(process.env.CI), "더미 기반 화면은 로컬 개발 서버 전용");
  test.skip(!hasAdminSessionEnv(), "관리자 세션 주입용 환경 변수가 필요합니다");
  test.beforeEach(async ({ context }) => loginAsAdmin(context));

  test("현재 프로필 값으로 채워져 열린다", async ({ page }) => {
    await page.goto("/profile/edit");
    await expect(page.getByLabel("표시 이름")).toHaveValue("관리자");
    await expect(page.locator("h1")).toHaveText("프로필 수정");
  });

  test("표시 이름을 비우고 저장하면 필드 오류를 보인다", async ({ page }) => {
    await page.goto("/profile/edit");
    await page.getByLabel("표시 이름").fill("");
    await page.getByRole("button", { name: "저장" }).click();
    await expect(page.getByText("표시 이름을 입력해 주세요")).toBeVisible();
  });

  test("허용하지 않는 형식의 이미지는 오류를 보인다", async ({ page }) => {
    await page.goto("/profile/edit");
    await page.getByLabel("프로필 이미지").setInputFiles({
      name: "a.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("x"),
    });
    await expect(
      page.getByText("PNG, JPG, GIF, WEBP 형식의 이미지만 올릴 수 있습니다"),
    ).toBeVisible();
  });

  test("변경이 없으면 [취소]가 바로 메인으로 이동한다", async ({ page }) => {
    await page.goto("/profile/edit");
    await page.getByRole("button", { name: "취소" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("변경 후 [취소]는 확인을 거치고, [계속 수정]은 머문다", async ({
    page,
  }) => {
    await page.goto("/profile/edit");
    await page.getByLabel("표시 이름").fill("새 이름");
    await page.getByRole("button", { name: "취소" }).click();
    await expect(page.getByText("저장하지 않고 나갈까요?")).toBeVisible();
    await page.getByRole("button", { name: "계속 수정" }).click();
    await expect(page).toHaveURL(/\/profile\/edit$/);
    await expect(page.getByLabel("표시 이름")).toHaveValue("새 이름");
  });

  test("변경 후 [취소] → [나가기]는 메인으로 이동한다", async ({ page }) => {
    await page.goto("/profile/edit");
    await page.getByLabel("표시 이름").fill("새 이름");
    await page.getByRole("button", { name: "취소" }).click();
    await page.getByRole("button", { name: "나가기" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("저장하면 메인으로 이동한다", async ({ page }) => {
    await page.goto("/profile/edit");
    await page.getByLabel("표시 이름").fill("새 이름");
    await page.getByRole("button", { name: "저장" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
