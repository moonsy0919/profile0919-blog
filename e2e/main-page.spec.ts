import { expect, test } from "@playwright/test";
import { hasAdminSessionEnv, loginAsAdmin } from "./helpers/admin-session";

// 게시글 영역은 Supabase 실데이터(시드 글 7개·태그 4개)를 읽고, 개발 일기 영역은 아직 더미라 개발 서버에서만 보인다.
// CI에는 Supabase 환경 변수가 없어 실데이터를 읽을 수 없으므로 로컬 전용으로 둔다.
test.skip(
  Boolean(process.env.CI),
  "실데이터 읽기·더미 화면은 로컬 개발 서버 전용",
);
test.skip(
  !hasAdminSessionEnv(),
  "관리자 세션 주입용 환경 변수(.env.local)가 필요합니다",
);

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
    .getByRole("link", { name: /^개발/ })
    .click();

  await expect(page).toHaveURL(`/?tag=${encodeURIComponent("개발")}`);
  const hrefs = await page
    .locator(`${postSection} article a[href^='/posts/']`)
    .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    expect(href).toContain(`tag=${encodeURIComponent("개발")}`);
  }
});

test("사이드바의 태그별 개수와 필터 결과가 일치한다", async ({ page }) => {
  await page.goto("/");
  const tagLinks = page
    .getByRole("navigation", { name: "태그" })
    .getByRole("link");
  // 사이드바는 DB 조회 뒤에 스트리밍으로 그려지므로 보일 때까지 기다린 뒤 읽는다(evaluateAll은 자동 대기하지 않는다)
  await expect(tagLinks.first()).toBeVisible();
  const entries = await tagLinks.evaluateAll((links) =>
    links.map((a) => ({
      href: a.getAttribute("href") ?? "",
      count: Number(a.textContent?.match(/(\d+)$/)?.[1]),
    })),
  );
  expect(entries.length).toBeGreaterThan(1);

  for (const { href, count } of entries) {
    await page.goto(href);
    // 한 페이지는 최대 6개라 개수가 6을 넘으면 첫 페이지에는 6개가 보인다
    await expect(page.locator(`${postSection} article`)).toHaveCount(
      Math.min(count, 6),
    );
  }
});

test("전체 보기 개수에 맞춰 마지막 페이지에 남은 글만 보인다", async ({
  page,
}) => {
  await page.goto("/");
  const total = Number(
    (
      await page
        .getByRole("navigation", { name: "태그" })
        .getByRole("link", { name: /^전체 보기/ })
        .innerText()
    ).match(/(\d+)$/)?.[1],
  );
  const lastPage = Math.ceil(total / 6);
  await page.goto(`/?page=${lastPage}`);
  await expect(page.locator(`${postSection} article`)).toHaveCount(
    total - (lastPage - 1) * 6,
  );
});

test("대소문자가 다른 태그 쿼리도 같은 태그로 찾고 사이드바에서 강조한다", async ({
  page,
}) => {
  await page.goto("/?tag=next.js");
  await expect(page.locator(`${postSection} article`)).toHaveCount(1);
  await expect(
    page.getByRole("navigation", { name: "태그" }).locator("[aria-current]"),
  ).toHaveText(/^Next\.js/);
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

test("개발 일기 영역은 최신 4개와 목록으로 가는 제목 링크를 보여 준다", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(`${devLogSection} article`)).toHaveCount(4);
  await expect(
    page.locator(devLogSection).getByRole("link", { name: "개발 일기" }),
  ).toHaveAttribute("href", "/dev-logs");
});

test("[게시]는 관리자에게만 보인다", async ({ page, context }) => {
  await page.goto("/");
  await expect(
    page
      .locator(devLogSection)
      .getByRole("link", { name: "게시", exact: true }),
  ).toHaveCount(0);

  await loginAsAdmin(context);
  await page.goto("/");
  await expect(
    page
      .locator(devLogSection)
      .getByRole("link", { name: "게시", exact: true }),
  ).toHaveAttribute("href", "/dev-logs/new");
});
