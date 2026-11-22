import { expect, test, type Page } from "@playwright/test";
import {
  createServiceClient,
  hasAdminSessionEnv,
  loginAsAdmin,
} from "./helpers/admin-session";

// 실제 작성 폼으로 만든 글이 읽기 화면(목록·사이드바·필터·상세·sitemap)에 나타나는지 검증한다(Task 021-R).
// 운영 Supabase에 쓰므로 로컬 전용이고, 만든 글·태그는 `[e2e]` 접두어로 구분해 끝에서 지운다.
test.skip(Boolean(process.env.CI), "운영 Supabase에 쓰므로 로컬 전용");
test.skip(
  !hasAdminSessionEnv(),
  "관리자 세션·서비스 키용 환경 변수(.env.local)가 필요합니다",
);

const E2E_PREFIX = "[e2e]";
const SEARCH = "태그 검색 또는 새 태그 입력";
const postSection = "section[aria-labelledby='post-list-heading']";
const PAGE_SIZE = 6;

/** 테스트마다 다른 짧은 접미어 */
function suffix() {
  return String(Date.now()).slice(-6);
}

/** 남아 있는 `[e2e]` 글·태그를 서비스 키로 지운다(post_tags는 cascade) */
async function cleanup() {
  const service = createServiceClient();
  await service.from("posts").delete().like("title", `${E2E_PREFIX}%`);
  await service.from("tags").delete().like("name", `${E2E_PREFIX}%`);
}

/** 사이드바의 "전체 보기 N"에서 N을 읽는다. 스트리밍이 끝나 보일 때까지 기다린다 */
async function readTotal(page: Page): Promise<number> {
  const all = page
    .getByRole("navigation", { name: "태그" })
    .getByRole("link", { name: /^전체 보기/ });
  await expect(all).toBeVisible();
  return Number((await all.innerText()).match(/(\d+)$/)?.[1]);
}

/** 작성 폼에 [e2e] 글을 채우고 새 태그를 등록·선택해 저장한다 */
async function writePost(page: Page, title: string, slug: string, tag: string) {
  await page.goto("/posts/new");
  await page.getByLabel("제목").fill(title);
  await page.getByLabel("slug").fill(slug);
  await page.getByLabel("본문").fill("## 읽기 검증\n\n본문 **굵게**");
  await page.getByPlaceholder(SEARCH).fill(tag);
  await page.getByRole("button", { name: "추가" }).click();
  await expect(page.getByLabel(`${tag} 태그 제거`)).toBeVisible();
  await page.getByRole("button", { name: "저장" }).click();
  await expect(page).toHaveURL(new RegExp(`/posts/${slug}$`));
}

test.beforeEach(async ({ context }) => {
  await cleanup();
  await loginAsAdmin(context);
});
test.afterEach(cleanup);

test("작성한 글이 목록·사이드바·필터·상세·sitemap에 나타난다", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const id = suffix();
  const title = `${E2E_PREFIX} 읽기 ${id}`;
  const slug = `e2e-read-${id}`;
  const tag = `${E2E_PREFIX}R${id}`;
  const orphan = `${E2E_PREFIX}O${id}`;
  const tagQuery = encodeURIComponent(tag);

  // 글에 연결하지 않은 태그(사이드바에 나오면 안 된다)
  await createServiceClient().from("tags").insert({ name: orphan });
  await page.goto("/");
  const before = await readTotal(page);

  await test.step("작성 → 상세 이동", async () => {
    await writePost(page, title, slug, tag);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(
      page.getByRole("heading", { name: "읽기 검증" }),
    ).toBeVisible();
    await expect(page.getByRole("list", { name: "태그" })).toContainText(tag);
  });

  await test.step("메인 목록은 최신순으로 첫 카드가 새 글이다", async () => {
    await page.goto("/");
    const cards = page.locator(`${postSection} article`);
    await expect(cards).toHaveCount(PAGE_SIZE);
    await expect(cards.first()).toContainText(title);
  });

  await test.step("사이드바: 전체 보기 +1, 새 태그는 1개, 미연결 태그는 없다", async () => {
    expect(await readTotal(page)).toBe(before + 1);
    const nav = page.getByRole("navigation", { name: "태그" });
    await expect(nav.getByRole("link", { name: tag })).toHaveText(/1$/);
    await expect(nav.getByText(orphan)).toHaveCount(0);
  });

  await test.step("태그 필터는 새 글만 보이고 대소문자 변형도 같다", async () => {
    for (const query of [tagQuery, encodeURIComponent(tag.toUpperCase())]) {
      await page.goto(`/?tag=${query}`);
      const cards = page.locator(`${postSection} article`);
      await expect(cards).toHaveCount(1);
      await expect(cards.first()).toContainText(title);
    }
  });

  await test.step("필터에서 상세로 갔다 오면 tag가 복원된다", async () => {
    await page.goto(`/?tag=${tagQuery}`);
    await page.locator(`${postSection} article a[href^='/posts/']`).click();
    await expect(page).toHaveURL(new RegExp(`/posts/${slug}\\?tag=`));
    await page.getByRole("link", { name: "목록으로" }).click();
    await expect(page).toHaveURL(`/?tag=${tagQuery}`);
  });

  await test.step("sitemap에 상세 주소가 들어 있다", async () => {
    const body = await (await page.request.get("/sitemap.xml")).text();
    expect(body).toMatch(new RegExp(`/posts/${slug}</loc>`));
  });

  await test.step("글이 늘어난 뒤에도 2페이지 복원이 동작한다", async () => {
    await page.goto("/?page=2");
    await page
      .locator(`${postSection} article a[href^='/posts/']`)
      .first()
      .click();
    await expect(page).toHaveURL(/\/posts\/.+page=2/);
    await page.getByRole("link", { name: "목록으로" }).click();
    await expect(page).toHaveURL(/\/\?page=2$/);
  });
});
