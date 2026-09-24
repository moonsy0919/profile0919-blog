import { expect, test } from "@playwright/test";

test("홈페이지가 렌더링된다", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Next\.js Starter Kit/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("헤더 링크로 소개 페이지로 이동한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "소개" }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { name: "소개" })).toBeVisible();
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

test("robots.txt와 sitemap.xml을 제공한다", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain("Sitemap:");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).toContain("/about");
});

test("현재 페이지의 네비게이션 링크에 aria-current가 표시된다", async ({
  page,
}) => {
  await page.goto("/about");
  const nav = page.getByRole("navigation", { name: "주요 메뉴" });
  await expect(nav.getByRole("link", { name: "소개" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav.getByRole("link", { name: "홈" })).not.toHaveAttribute(
    "aria-current",
    "page",
  );
});
