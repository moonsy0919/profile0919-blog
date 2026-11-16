import { expect, test } from "@playwright/test";

// 메인 본문은 더미 데이터라 프로덕션(CI는 프로덕션 빌드)에서는 임시 화면이다. 개발 서버에서만 검증한다.
test.skip(Boolean(process.env.CI), "더미 기반 화면은 로컬 개발 서버 전용");

const postSection = "section[aria-labelledby='post-list-heading']";
const devLogSection = "section[aria-labelledby='dev-log-heading']";

test("기본 목록은 게시글 6개와 페이지 번호를 보여 준다", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(`${postSection} article`)).toHaveCount(6);
  await expect(
    page.getByRole("navigation", { name: "페이지 이동" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "태그" }).locator("[aria-current]"),
  ).toHaveText(/전체 보기/);
});

test("태그를 누르면 해당 태그 글만 보이고 page 쿼리는 사라진다", async ({
  page,
}) => {
  await page.goto("/?page=2");
  await page
    .getByRole("navigation", { name: "태그" })
    .getByRole("link", { name: /^React/ })
    .click();

  await expect(page).toHaveURL(/\/\?tag=React$/);
  const hrefs = await page
    .locator(`${postSection} article a[href^='/posts/']`)
    .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) expect(href).toContain("tag=React");
});

test("범위를 벗어난 page는 마지막 페이지로 보정된다", async ({ page }) => {
  await page.goto("/?page=99");
  const current = page
    .getByRole("navigation", { name: "페이지 이동" })
    .locator("[aria-current='page']");
  const lastPage = await current.innerText();
  expect(Number(lastPage)).toBeGreaterThan(1);
  await expect(page.locator(`${postSection} article`).first()).toBeVisible();
});

test("존재하지 않는 태그는 빈 상태와 [전체 보기]를 보여 준다", async ({
  page,
}) => {
  await page.goto("/?tag=" + encodeURIComponent("없는태그"));
  await expect(page.getByText("해당 태그의 글이 없습니다")).toBeVisible();
  await page
    .locator(postSection)
    .getByRole("link", { name: "전체 보기", exact: true })
    .click();
  await expect(page).toHaveURL(/\/$/);
});

test("카드 링크가 현재 tag/page를 상세로 전달한다", async ({ page }) => {
  await page.goto("/?page=2");
  const href = await page
    .locator(`${postSection} article a[href^='/posts/']`)
    .first()
    .getAttribute("href");
  expect(href).toContain("page=2");
});

test("개발 일기 영역은 최신 4개와 더 보기 링크를 보여 준다", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(`${devLogSection} article`)).toHaveCount(4);
  await expect(
    page
      .locator(devLogSection)
      .getByRole("link", { name: "개발 일기 더 보기" }),
  ).toHaveAttribute("href", "/dev-logs");
});

test("[게시]는 관리자 미리보기에서만 보인다", async ({ page, context }) => {
  await page.goto("/");
  await expect(
    page
      .locator(devLogSection)
      .getByRole("link", { name: "게시", exact: true }),
  ).toHaveCount(0);

  await context.addCookies([
    { name: "dev-viewer", value: "admin", url: "http://localhost:3100" },
  ]);
  await page.goto("/");
  await expect(
    page
      .locator(devLogSection)
      .getByRole("link", { name: "게시", exact: true }),
  ).toHaveAttribute("href", "/dev-logs/new");
});
