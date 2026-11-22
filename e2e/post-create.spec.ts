import { expect, test, type Page } from "@playwright/test";
import {
  createServiceClient,
  hasAdminSessionEnv,
  loginAsAdmin,
} from "./helpers/admin-session";

/** 개발·운영이 같은 Supabase 프로젝트라서 테스트가 만든 글·태그에는 이 접두어를 붙인다 */
const E2E_PREFIX = "[e2e]";
const SEARCH = "태그 검색 또는 새 태그 입력";

/** 테스트마다 다른 짧은 접미어 */
function suffix() {
  return String(Date.now()).slice(-6);
}

/** 작성 폼에 필수 값을 채운다 */
async function fillPostForm(page: Page, title: string, slug: string) {
  await page.goto("/posts/new");
  await page.getByLabel("제목").fill(title);
  await page.getByLabel("slug").fill(slug);
  await page.getByLabel("본문").fill("## e2e 본문\n\n생성 테스트");
}

test.describe("게시글 작성 접근 제한", () => {
  test("비관리자가 /posts/new를 열면 로그인으로 보낸다(프로덕션 포함)", async ({
    page,
  }) => {
    await page.goto("/posts/new");
    await expect(page).toHaveURL(/\/login\?next=%2Fposts%2Fnew$/);
  });
});

test.describe("게시글 작성 (실데이터)", () => {
  test.skip(Boolean(process.env.CI), "운영 Supabase에 쓰므로 로컬 전용");
  test.skip(
    !hasAdminSessionEnv(),
    "관리자 세션·서비스 키용 환경 변수(.env.local)가 필요합니다",
  );

  test.beforeEach(async ({ context }) => {
    await loginAsAdmin(context);
  });

  // 시나리오가 만든 글(post_tags는 cascade)과 태그를 서비스 키로 정리한다
  test.afterEach(async () => {
    const service = createServiceClient();
    await service.from("posts").delete().like("title", `${E2E_PREFIX}%`);
    await service.from("tags").delete().like("name", `${E2E_PREFIX}%`);
  });

  test("저장하면 DB에 즉시 공개로 저장되고 상세로 이동한다", async ({
    page,
  }) => {
    const id = suffix();
    const title = `${E2E_PREFIX} 작성 ${id}`;
    const slug = `e2e-create-${id}`;
    const tag = `${E2E_PREFIX}Tag${id}`;
    await fillPostForm(page, title, slug);
    await page.getByPlaceholder(SEARCH).fill(tag);
    await page.getByRole("button", { name: "추가" }).click();
    await expect(page.getByLabel(`${tag} 태그 제거`)).toBeVisible();

    await page.getByRole("button", { name: "저장" }).click();
    await expect(page.getByText("글이 저장되었습니다")).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/posts/${slug}$`));
    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    const { data } = await createServiceClient()
      .from("posts")
      .select("published, post_tags(tags(name))")
      .eq("slug", slug)
      .single();
    expect(data?.published).toBe(true);
    // 생성 타입은 조인 결과를 배열로 추론하지만 런타임에는 단일 객체라 둘 다 받는다
    const names = data?.post_tags.flatMap((link) =>
      [link.tags].flat().map((linked) => linked.name),
    );
    expect(names).toEqual([tag]);
  });

  test("이미 쓰는 slug면 slug 필드 오류를 보이고 입력값을 유지한다", async ({
    page,
  }) => {
    const title = `${E2E_PREFIX} 중복 ${suffix()}`;
    await fillPostForm(page, title, "hello-world");
    await page.getByRole("button", { name: "저장" }).click();

    await expect(page.getByText("이미 사용 중인 slug입니다.")).toBeVisible();
    await expect(page).toHaveURL(/\/posts\/new$/);
    await expect(page.getByLabel("제목")).toHaveValue(title);
    const { count } = await createServiceClient()
      .from("posts")
      .select("id", { count: "exact", head: true })
      .like("title", `${E2E_PREFIX}%`);
    expect(count).toBe(0);
  });

  test("변경이 있을 때 [취소]는 이탈 확인을 거쳐 메인으로 돌아간다", async ({
    page,
  }) => {
    await fillPostForm(page, `${E2E_PREFIX} 취소`, "e2e-cancel");
    await page.getByRole("button", { name: "취소" }).click();
    await expect(page.getByText("저장하지 않고 나갈까요?")).toBeVisible();
    await page.getByRole("button", { name: "나가기" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
