import { expect, test } from "@playwright/test";

/** 프로덕션에서 404로 닫혀야 하는 더미 기반 경로 (개발 서버에서는 열려 있다) */
const gatedPaths = [
  "/dev-logs",
  "/dev-logs/1",
  "/dev-logs/new",
  "/login",
  "/posts/hello",
  "/posts/new",
  "/profile/edit",
  "/weather-header",
];

test("홈페이지가 렌더링된다", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/profile0919/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("/posts는 쿼리를 유지한 채 메인으로 임시 리디렉션된다", async ({
  page,
  request,
}) => {
  const redirect = await request.get("/posts?tag=react&page=2", {
    maxRedirects: 0,
  });
  expect(redirect.status()).toBe(307);
  expect(redirect.headers()["location"]).toBe("/?tag=react&page=2");

  await page.goto("/posts");
  await expect(page).toHaveURL(/\/$/);
});

test("테마 토글이 다크 모드를 켜고 끈다", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const html = page.locator("html");
  await page.getByRole("button", { name: "테마 전환" }).click();
  await expect(html).toHaveClass(/dark/);
  await page.getByRole("button", { name: "테마 전환" }).click();
  await expect(html).not.toHaveClass(/dark/);
});

test("존재하지 않는 경로는 404 페이지를 보여준다", async ({ page }) => {
  const response = await page.goto("/does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "페이지를 찾을 수 없습니다" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "홈으로 돌아가기" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("메인은 확장형, 404는 압축형 헤더를 하나만 렌더링한다", async ({
  page,
}) => {
  await page.goto("/");
  const mainHeader = page.locator("header");
  await expect(mainHeader).toHaveCount(1);
  await expect(mainHeader).toHaveAttribute("data-header-variant", "expanded");

  await page.goto("/does-not-exist");
  const notFoundHeader = page.locator("header");
  await expect(notFoundHeader).toHaveCount(1);
  await expect(notFoundHeader).toHaveAttribute(
    "data-header-variant",
    "compact",
  );
});

test("헤더는 main 밖에 있고 메뉴 네비게이션과 푸터가 없다", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("banner")).toHaveCount(1);
  await expect(page.locator("main header")).toHaveCount(0);
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expect(page.getByRole("contentinfo")).toHaveCount(0);
});

test("프로필은 메인 헤더에만 있고 방문자 HTML에는 관리 버튼과 로그인이 없다", async ({
  page,
}) => {
  // 개발 서버(로컬)에서는 [로그인]과 뷰어 토글이 보이므로 프로덕션 빌드(CI)에서만 검증한다.
  test.skip(!process.env.CI, "프로덕션 빌드에서만 검증");
  await page.goto("/");
  await expect(page.getByTestId("header-profile")).toBeVisible();
  await page.goto("/does-not-exist");
  await expect(page.getByTestId("header-profile")).toHaveCount(0);

  // 서버가 내려준 HTML 중 헤더 영역만 검사한다(본문의 임시 문구에도 "로그인"이 들어 있다).
  const html = await (await page.request.get("/")).text();
  const headerHtml = html.match(/<header[\s\S]*?<\/header>/)?.[0] ?? "";
  expect(headerHtml).not.toBe("");
  for (const text of [
    "로그인",
    "작성",
    "로그아웃",
    "/posts/new",
    "/profile/edit",
  ]) {
    expect(headerHtml).not.toContain(text);
  }
});

test("robots.txt와 sitemap.xml을 제공하고 닫힌 경로는 사이트맵에 없다", async ({
  request,
}) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain("Sitemap:");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const body = await sitemap.text();
  for (const closedPath of [
    "/posts",
    "/login",
    "/api/weather",
    "/weather-header",
  ]) {
    expect(body).not.toContain(closedPath);
  }
});

test("/api/weather 응답에는 Set-Cookie가 붙지 않는다", async ({ request }) => {
  const response = await request.get("/api/weather");
  // 외부 API 상태와 무관하게(200/502 모두) 쿠키는 설정되지 않아야 한다.
  expect([200, 502]).toContain(response.status());
  expect(response.headers()["set-cookie"]).toBeUndefined();
});

test.describe("더미 게이트 (프로덕션 빌드 전용)", () => {
  test.skip(
    !process.env.CI,
    "개발 서버에서는 더미 경로가 열려 있어 프로덕션 빌드(CI)에서만 검증한다",
  );

  for (const path of gatedPaths) {
    test(`${path} 는 HTTP 404를 반환한다`, async ({ page, request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(404);

      await page.goto(path);
      await expect(
        page.getByRole("heading", { name: "페이지를 찾을 수 없습니다" }),
      ).toBeVisible();
    });
  }
});
