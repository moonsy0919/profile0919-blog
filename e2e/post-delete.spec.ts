import { expect, test, type Page } from "@playwright/test";
import {
  createServiceClient,
  hasAdminSessionEnv,
  loginAsAdmin,
} from "./helpers/admin-session";
import {
  E2E_PREFIX,
  assertSeedPostsIntact,
  cleanup,
  countPostTags,
  countPostsBySlug,
  objectExists,
  seedImage,
  seedPost,
  suffix,
} from "./helpers/post-seed";

// 게시글 삭제(Task 021-D)를 실데이터로 검증한다. 삭제 대상은 서비스 키로 만든 `[e2e]` 글뿐이고
// 시드 글은 건드리지 않는다(매 테스트 앞뒤로 7개가 남아 있는지 확인한다). 운영 Supabase를 쓰므로 로컬 전용이다.
test.skip(Boolean(process.env.CI), "운영 Supabase에 쓰므로 로컬 전용");
test.skip(
  !hasAdminSessionEnv(),
  "관리자 세션·서비스 키용 환경 변수(.env.local)가 필요합니다",
);

const postSection = "section[aria-labelledby='post-list-heading']";

/** 사이드바의 "전체 보기 N"에서 N을 읽는다. 스트리밍이 끝나 보일 때까지 기다린다 */
async function readTotal(page: Page): Promise<number> {
  const all = page
    .getByRole("navigation", { name: "태그" })
    .getByRole("link", { name: /^전체 보기/ });
  await expect(all).toBeVisible();
  return Number((await all.innerText()).match(/(\d+)$/)?.[1]);
}

/** 상세에서 [삭제]를 눌러 확인 다이얼로그를 연다 */
async function openDeleteDialog(page: Page, slug: string) {
  await page.goto(`/posts/${slug}`);
  await page.getByRole("button", { name: "삭제", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("글을 삭제할까요?")).toBeVisible();
  await expect(
    dialog.getByText("삭제한 글은 되돌릴 수 없습니다."),
  ).toBeVisible();
  return dialog;
}

test.beforeEach(async ({ context }) => {
  await assertSeedPostsIntact();
  await cleanup();
  await loginAsAdmin(context);
});
test.afterEach(async () => {
  await cleanup();
  await assertSeedPostsIntact();
});

test("[삭제]를 확인하면 목록·사이드바·상세·sitemap·DB·Storage에서 모두 사라진다", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const id = suffix();
  const slug = `e2e-del-${id}`;
  const tag = `${E2E_PREFIX}D${id}`;
  const image = await seedImage();
  const postId = await seedPost({
    slug,
    tagName: tag,
    thumbnailUrl: image.url,
  });
  const title = `${E2E_PREFIX} 원래 제목 ${slug}`;

  await page.goto("/");
  const before = await readTotal(page);
  const nav = page.getByRole("navigation", { name: "태그" });
  await expect(nav.getByRole("link", { name: tag })).toHaveText(/1$/);

  const dialog = await openDeleteDialog(page, slug);
  await dialog.getByRole("button", { name: "삭제", exact: true }).click();
  await expect(page.getByText("글이 삭제되었습니다")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);

  // 수락 기준: 목록에서 사라지고 상세 URL은 404
  expect(await readTotal(page)).toBe(before - 1);
  await expect(
    page.locator(`${postSection} article`).filter({ hasText: title }),
  ).toHaveCount(0);
  await expect(nav.getByText(tag)).toHaveCount(0);
  expect((await page.request.get(`/posts/${slug}`)).status()).toBe(404);
  // 삭제된 글의 주소를 화면으로 열어도 404 화면에 헤더·main이 하나씩만 나온다
  await page.goto(`/posts/${slug}`);
  await expect(page.locator("header")).toHaveCount(1);
  await expect(page.locator("main")).toHaveCount(1);
  expect(await (await page.request.get("/sitemap.xml")).text()).not.toContain(
    `/posts/${slug}<`,
  );

  // DB 행과 태그 매핑(cascade), Storage 객체까지 정리된다
  expect(await countPostsBySlug(slug)).toBe(0);
  expect(await countPostTags(postId)).toBe(0);
  await expect.poll(() => objectExists(image.path)).toBe(false);
});

test("폼을 열어 둔 사이 이미 지워진 글은 안내 후 메인으로 이동한다", async ({
  page,
}) => {
  const slug = `e2e-del-gone-${suffix()}`;
  const postId = await seedPost({ slug });

  const dialog = await openDeleteDialog(page, slug);
  await createServiceClient().from("posts").delete().eq("id", postId);
  await dialog.getByRole("button", { name: "삭제", exact: true }).click();

  await expect(page.getByText("이미 삭제된 글입니다.")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test("[취소]와 Esc는 글도 이미지도 지우지 않고 상세에 머문다", async ({
  page,
}) => {
  const slug = `e2e-del-cancel-${suffix()}`;
  const image = await seedImage();
  await seedPost({ slug, thumbnailUrl: image.url });

  const dialog = await openDeleteDialog(page, slug);
  await dialog.getByRole("button", { name: "취소" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await openDeleteDialog(page, slug);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await expect(page).toHaveURL(new RegExp(`/posts/${slug}$`));
  expect(await countPostsBySlug(slug)).toBe(1);
  expect(await objectExists(image.path)).toBe(true);
});

test("썸네일이 없는 글도 삭제되고 다른 글의 이미지는 건드리지 않는다", async ({
  page,
}) => {
  const slug = `e2e-del-nothumb-${suffix()}`;
  const bystander = await seedImage(); // 어떤 글에도 붙이지 않은 객체
  await seedPost({ slug });

  const dialog = await openDeleteDialog(page, slug);
  await dialog.getByRole("button", { name: "삭제", exact: true }).click();
  await expect(page.getByText("글이 삭제되었습니다")).toBeVisible();

  expect(await countPostsBySlug(slug)).toBe(0);
  expect(await objectExists(bystander.path)).toBe(true);
});

test("버킷 밖 썸네일 글은 삭제만 하고 Storage는 건드리지 않는다", async ({
  page,
}) => {
  const slug = `e2e-del-legacy-${suffix()}`;
  const bystander = await seedImage();
  await seedPost({ slug, thumbnailUrl: `https://example.com/${slug}.png` });

  const dialog = await openDeleteDialog(page, slug);
  await dialog.getByRole("button", { name: "삭제", exact: true }).click();
  await expect(page.getByText("글이 삭제되었습니다")).toBeVisible();

  expect(await countPostsBySlug(slug)).toBe(0);
  expect(await objectExists(bystander.path)).toBe(true);
});
