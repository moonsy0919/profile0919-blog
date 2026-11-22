import { expect, test, type Page } from "@playwright/test";
import {
  createServiceClient,
  hasAdminSessionEnv,
  loginAsAdmin,
} from "./helpers/admin-session";
import {
  E2E_PREFIX,
  PNG,
  cleanup,
  objectExists,
  readThumbnail,
  seedImage,
  seedPost,
  storagePaths,
  suffix,
} from "./helpers/post-seed";

// 게시글 수정 모드(Task 021-U)를 실데이터로 검증한다. 수정 대상은 서비스 키로 만든 `[e2e]` 글이며,
// 운영 Supabase를 쓰므로 로컬 전용이고 글·태그·Storage 객체를 끝에서 지운다.
test.skip(Boolean(process.env.CI), "운영 Supabase에 쓰므로 로컬 전용");
test.skip(
  !hasAdminSessionEnv(),
  "관리자 세션·서비스 키용 환경 변수(.env.local)가 필요합니다",
);

const SEARCH = "태그 검색 또는 새 태그 입력";
const STORAGE_UPLOAD = /\/storage\/v1\/object\/thumbnails\/(posts\/[^/?]+)/;

/** 페이지가 보내는 Storage 업로드 요청의 객체 경로를 기록한다 */
function trackUploads(page: Page) {
  page.on("request", (request) => {
    const match = request.url().match(STORAGE_UPLOAD);
    if (request.method() === "POST" && match) storagePaths.push(match[1]);
  });
}

/** 글 상세에서 [수정]을 눌러 수정 모드로 들어간다 */
async function openEditMode(page: Page, path: string) {
  await page.goto(path);
  await page.getByRole("link", { name: "수정" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "게시글 수정" }),
  ).toBeVisible();
}

test.describe("게시글 수정 모드 (관리자)", () => {
  test.beforeEach(async ({ context }) => {
    await cleanup();
    await loginAsAdmin(context);
  });
  test.afterEach(cleanup);

  test("[수정]으로 같은 URL의 수정 모드가 열리고 기존 값이 채워진다", async ({
    page,
  }) => {
    const id = suffix();
    const slug = `e2e-edit-${id}`;
    const tag = `${E2E_PREFIX}A${id}`;
    await seedPost({ slug, tagName: tag });

    await openEditMode(page, `/posts/${slug}?page=2`);
    await expect(page).toHaveURL(new RegExp(`/posts/${slug}\\?page=2&edit=1$`));
    await expect(page.getByLabel("제목")).toHaveValue(
      `${E2E_PREFIX} 원래 제목 ${slug}`,
    );
    await expect(page.getByLabel("slug")).toHaveValue(slug);
    await expect(page.getByLabel("본문")).toHaveValue("원래 본문");
    await expect(page.getByLabel(`${tag} 태그 제거`)).toBeVisible();
    // 읽기 모드의 버튼은 DOM에 없다
    await expect(page.getByRole("link", { name: "목록으로" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "수정" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "삭제" })).toHaveCount(0);
  });

  test("저장하면 읽기 모드로 돌아가 제목·본문·태그·수정일이 반영된다", async ({
    page,
  }) => {
    const id = suffix();
    const slug = `e2e-save-${id}`;
    const oldTag = `${E2E_PREFIX}O${id}`;
    const newTag = `${E2E_PREFIX}N${id}`;
    const title = `${E2E_PREFIX} 수정된 제목 ${id}`;
    await seedPost({ slug, tagName: oldTag });

    await openEditMode(page, `/posts/${slug}?page=2`);
    await page.getByLabel("제목").fill(title);
    await page.getByLabel("본문").fill("수정된 본문입니다");
    await page.getByLabel(`${oldTag} 태그 제거`).click();
    await page.getByPlaceholder(SEARCH).fill(newTag);
    await page.getByRole("button", { name: "추가" }).click();
    // 등록·선택이 끝난 뒤 저장한다(칩이 보이기 전에 누르면 태그 없이 저장된다)
    await expect(page.getByLabel(`${newTag} 태그 제거`)).toBeVisible();
    await page.getByRole("button", { name: "저장" }).click();

    await expect(page.getByText("글이 수정되었습니다")).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/posts/${slug}\\?page=2$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.getByText("수정된 본문입니다")).toBeVisible();
    const tags = page.getByRole("list", { name: "태그" });
    await expect(tags).toContainText(newTag);
    await expect(tags).not.toContainText(oldTag);
    // 작성일과 수정일 두 개의 <time>
    await expect(page.locator("header time")).toHaveCount(2);

    // 목록 사이드바에도 새 태그만 보인다
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "태그" });
    await expect(nav.getByRole("link", { name: newTag })).toHaveText(/1$/);
    await expect(nav.getByText(oldTag)).toHaveCount(0);
  });

  test("slug를 바꾸면 새 주소로 이동하고 이전 주소는 404다", async ({
    page,
  }) => {
    const id = suffix();
    const slug = `e2e-old-${id}`;
    const nextSlug = `e2e-new-${id}`;
    await seedPost({ slug });

    await openEditMode(page, `/posts/${slug}`);
    await page.getByLabel("slug").fill(nextSlug);
    await expect(page.getByRole("status")).toContainText(`/posts/${slug}`);
    await page.getByRole("button", { name: "저장" }).click();

    await expect(page).toHaveURL(new RegExp(`/posts/${nextSlug}$`));
    const old = await page.request.get(`/posts/${slug}`);
    expect(old.status()).toBe(404);
  });

  test("이미 쓰는 slug면 slug 필드 오류를 보이고 입력값을 유지한다", async ({
    page,
  }) => {
    const id = suffix();
    const slug = `e2e-dup-a-${id}`;
    await seedPost({ slug });
    await seedPost({ slug: `e2e-dup-b-${id}` });

    await openEditMode(page, `/posts/${slug}`);
    await page.getByLabel("slug").fill(`e2e-dup-b-${id}`);
    await page.getByRole("button", { name: "저장" }).click();

    await expect(page.getByText("이미 사용 중인 slug입니다.")).toBeVisible();
    await expect(page).toHaveURL(/edit=1$/);
    await expect(page.getByLabel("slug")).toHaveValue(`e2e-dup-b-${id}`);
  });

  test("이미지를 교체하면 저장 성공 뒤에 이전 객체를 지운다", async ({
    page,
  }) => {
    const id = suffix();
    const slug = `e2e-img-${id}`;
    const old = await seedImage();
    await seedPost({ slug, thumbnailUrl: old.url });
    trackUploads(page);

    await openEditMode(page, `/posts/${slug}`);
    await page
      .locator("#thumbnail-file")
      .setInputFiles({ name: "new.png", mimeType: "image/png", buffer: PNG });
    await page.getByRole("button", { name: "저장" }).click();
    await expect(page.getByText("글이 수정되었습니다")).toBeVisible();

    const created = storagePaths.filter((path) => path !== old.path);
    expect(created).toHaveLength(1);
    expect(await objectExists(created[0])).toBe(true);
    await expect.poll(() => objectExists(old.path)).toBe(false);
    expect(await readThumbnail(slug)).toContain(created[0]);
  });

  test("이미지를 제거하고 저장하면 이전 객체를 지우고 썸네일을 비운다", async ({
    page,
  }) => {
    const slug = `e2e-imgrm-${suffix()}`;
    const old = await seedImage();
    await seedPost({ slug, thumbnailUrl: old.url });

    await openEditMode(page, `/posts/${slug}`);
    await page.getByRole("button", { name: "이미지 제거" }).click();
    await page.getByRole("button", { name: "저장" }).click();
    await expect(page.getByText("글이 수정되었습니다")).toBeVisible();

    await expect.poll(() => objectExists(old.path)).toBe(false);
    expect(await readThumbnail(slug)).toBeNull();
  });

  test("폼을 연 사이에 글이 삭제되면 안내 후 메인으로 이동한다", async ({
    page,
  }) => {
    const slug = `e2e-gone-${suffix()}`;
    const postId = await seedPost({ slug });

    await openEditMode(page, `/posts/${slug}`);
    await createServiceClient().from("posts").delete().eq("id", postId);
    await page.getByLabel("제목").fill(`${E2E_PREFIX} 사라진 글`);
    await page.getByRole("button", { name: "저장" }).click();

    await expect(page.getByText("글을 찾을 수 없습니다")).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test("변경 후 [취소]는 이탈 확인을 거쳐 읽기 모드(edit만 제거)로 돌아간다", async ({
    page,
  }) => {
    const slug = `e2e-cancel-${suffix()}`;
    await seedPost({ slug });

    await openEditMode(page, `/posts/${slug}?page=2`);
    await page.getByLabel("제목").fill(`${E2E_PREFIX} 바꾸다 취소`);
    await page.getByRole("button", { name: "취소" }).click();
    await expect(page.getByText("저장하지 않고 나갈까요?")).toBeVisible();
    await page.getByRole("button", { name: "나가기" }).click();

    await expect(page).toHaveURL(new RegExp(`/posts/${slug}\\?page=2$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      `${E2E_PREFIX} 원래 제목 ${slug}`,
    );
  });

  test("없는 slug는 edit=1이어도 404다", async ({ page }) => {
    const response = await page.goto(`/posts/e2e-none-${suffix()}?edit=1`);
    expect(response?.status()).toBe(404);
  });
});

test.describe("게시글 수정 모드 (방문자)", () => {
  test.beforeEach(async () => {
    await cleanup();
  });
  test.afterEach(cleanup);

  test("?edit=1은 로그인으로 보내고 방문자 HTML에는 [수정]이 없다", async ({
    page,
  }) => {
    const slug = `e2e-visitor-${suffix()}`;
    await seedPost({ slug });

    await page.goto(`/posts/${slug}`);
    await expect(page.getByRole("link", { name: "수정" })).toHaveCount(0);

    await page.goto(`/posts/${slug}?tag=x&edit=1`);
    await expect(page).toHaveURL(/\/login\?next=/);
    const next = new URL(page.url()).searchParams.get("next");
    expect(next).toBe(`/posts/${slug}?tag=x&edit=1`);
  });
});

// 프로덕션 빌드에서도 관리자 [수정]·[삭제]가 열려 있고 개발 일기·프로필의 더미 경로는 닫혀 있는지 확인한다.
// 프로덕션 빌드(`E2E_PRODUCTION_BUILD=1`, 실행 중인 `next start` 포트를 E2E_PORT로 지정)에서만 실행한다.
test.describe("프로덕션 빌드의 게시글 수정 노출", () => {
  test.skip(
    process.env.E2E_PRODUCTION_BUILD !== "1",
    "프로덕션 빌드 서버(E2E_PRODUCTION_BUILD=1)에서만 검증한다",
  );

  test.beforeEach(async ({ context }) => {
    await loginAsAdmin(context);
  });

  test("관리자에게 [수정]과 [삭제]가 모두 열려 있다", async ({ page }) => {
    await page.goto("/posts/hello-world");
    await expect(page.getByRole("link", { name: "수정" })).toBeVisible();
    // 삭제 실행은 하지 않는다(운영 시드 글). 버튼 노출만 확인한다
    await expect(
      page.getByRole("button", { name: "삭제", exact: true }),
    ).toBeVisible();

    await page.getByRole("link", { name: "수정" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "게시글 수정" }),
    ).toBeVisible();
  });

  test("개발 일기·프로필 쪽 더미 경로는 여전히 404다", async ({ page }) => {
    for (const path of ["/dev-logs/new", "/profile/edit"]) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
    }
  });
});
