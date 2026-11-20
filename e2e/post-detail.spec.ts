import { expect, test, type BrowserContext } from "@playwright/test";
import { hasAdminSessionEnv, loginAsAdmin } from "./helpers/admin-session";
import { firstDevLogPath } from "./helpers/dev-log";

// 게시글 상세(시드 글 7개)와 개발 일기 목록·상세(시드 5개)는 Supabase 실데이터를 읽는다. 수정 모드·삭제는 더미 액션이라 개발 환경 전용이다.
// CI에는 Supabase 환경 변수가 없어 로컬 개발 서버에서만 검증한다.
test.skip(Boolean(process.env.CI), "실데이터 읽기는 로컬 개발 서버 전용");
test.skip(
  !hasAdminSessionEnv(),
  "관리자 세션 주입용 환경 변수(.env.local)가 필요합니다",
);

const POST = "/posts/hello-world";
const TAG = encodeURIComponent("개발");

/** 관리자로 로그인한 상태로 만든다 */
async function asAdmin(context: BrowserContext) {
  await loginAsAdmin(context);
}

test.describe("게시글 상세", () => {
  test("카드에서 상세로 갔다가 [목록으로]를 누르면 page가 복원된다", async ({
    page,
  }) => {
    await page.goto("/?page=2");
    await page.locator("article a[href^='/posts/']").first().click();
    await expect(page).toHaveURL(/\/posts\/.+page=2/);

    await page.getByRole("link", { name: "목록으로" }).click();
    await expect(page).toHaveURL(/\/\?page=2$/);
  });

  test("[목록으로]는 선택했던 태그도 복원한다", async ({ page }) => {
    await page.goto(`/?tag=${TAG}`);
    await page.locator("article a[href^='/posts/']").first().click();
    await expect(page).toHaveURL(new RegExp(`\\?tag=${TAG}$`));
    await page.getByRole("link", { name: "목록으로" }).click();
    await expect(page).toHaveURL(`/?tag=${TAG}`);
  });

  test("직접 접근하면 [목록으로]는 기본 목록으로 간다", async ({ page }) => {
    await page.goto(POST);
    await expect(page.getByRole("link", { name: "목록으로" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  test("h1은 하나이고 본문의 # 제목은 h2로 그려진다", async ({ page }) => {
    await page.goto(POST);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
  });

  test("없는 slug는 HTTP 404다", async ({ page }) => {
    const response = await page.goto("/posts/없는-글");
    expect(response?.status()).toBe(404);
  });

  test("방문자에게는 [수정]/[삭제]가 없다", async ({ page }) => {
    await page.goto(POST);
    await expect(page.getByRole("link", { name: "수정" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "삭제" })).toHaveCount(0);
  });

  test("태그 칩은 해당 태그의 메인 목록으로 이동한다", async ({ page }) => {
    await page.goto(POST);
    await page
      .getByRole("list", { name: "태그" })
      .getByRole("link")
      .first()
      .click();
    await expect(page).toHaveURL(/\/\?tag=/);
  });
});

test.describe("수정 모드 전환", () => {
  test("[수정]은 같은 URL에 edit=1을 붙여 수정 모드로 바꾸고 [취소]로 돌아온다", async ({
    page,
    context,
  }) => {
    await asAdmin(context);
    await page.goto(`${POST}?tag=Next.js&page=2`);
    await page.getByRole("link", { name: "수정" }).click();

    await expect(page).toHaveURL(
      /\/posts\/hello-world\?tag=Next\.js&page=2&edit=1$/,
    );
    await expect(
      page.getByRole("heading", { level: 1, name: "게시글 수정" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "목록으로" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "수정" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "삭제" })).toHaveCount(0);

    await page.getByRole("button", { name: "취소" }).click();
    await expect(page).toHaveURL(/\/posts\/hello-world\?tag=Next\.js&page=2$/);
    await expect(page.getByRole("link", { name: "수정" })).toBeVisible();
  });

  test("수정 모드 응답은 noindex다", async ({ page, context }) => {
    await asAdmin(context);
    await page.goto(`${POST}?edit=1`);
    await expect(page.locator("meta[name='robots']")).toHaveAttribute(
      "content",
      /noindex/,
    );
  });

  test("방문자의 edit=1은 로그인으로 보내고 로그인하면 같은 수정 모드로 돌아온다", async ({
    page,
  }) => {
    await page.goto(`${POST}?tag=Next.js&edit=1`);
    await expect(page).toHaveURL(/\/login\?next=/);
    const next = new URL(page.url()).searchParams.get("next");
    expect(next).toBe(`${POST}?tag=Next.js&edit=1`);
  });

  test("없는 slug는 edit=1이어도 404다", async ({ page, context }) => {
    await asAdmin(context);
    const response = await page.goto("/posts/없는-글?edit=1");
    expect(response?.status()).toBe(404);
  });
});

test.describe("삭제 확인 다이얼로그", () => {
  test("[취소]로 닫으면 삭제하지 않고 상세에 머문다", async ({
    page,
    context,
  }) => {
    await asAdmin(context);
    await page.goto(POST);
    await page.getByRole("button", { name: "삭제", exact: true }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("글을 삭제할까요?")).toBeVisible();
    await expect(
      dialog.getByText("삭제한 글은 되돌릴 수 없습니다."),
    ).toBeVisible();

    await dialog.getByRole("button", { name: "취소" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`${POST}$`));
  });

  test("Esc로 닫는다", async ({ page, context }) => {
    await asAdmin(context);
    await page.goto(POST);
    await page.getByRole("button", { name: "삭제", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`${POST}$`));
  });

  // 게시글 삭제 확인은 더미 deletePost가 실제 글 id를 모르므로 Task 021-D(실연동)에서 검증한다.

  // 개발 일기 삭제 확인은 더미 deleteDevLog가 실제 글 id를 모르므로 Task 022-D(실연동)에서 검증한다.
});

test.describe("개발 일기 목록", () => {
  test("한 페이지에 4개를 보여 주고 페이지 번호로 이동한다", async ({
    page,
  }) => {
    await page.goto("/dev-logs");
    await expect(page.locator("article")).toHaveCount(4);

    await page
      .getByRole("navigation", { name: "페이지 이동" })
      .getByRole("link", { name: "2", exact: true })
      .click();
    await expect(page).toHaveURL(/\/dev-logs\?page=2$/);
    await expect(page.locator("article")).toHaveCount(1);
  });

  test("범위를 벗어난 page는 마지막 페이지로 보정된다", async ({ page }) => {
    await page.goto("/dev-logs?page=99");
    await expect(
      page
        .getByRole("navigation", { name: "페이지 이동" })
        .locator("[aria-current='page']"),
    ).toHaveText("2");
  });

  test("[게시]는 관리자에게만 보인다", async ({ page, context }) => {
    await page.goto("/dev-logs");
    await expect(
      page.getByRole("link", { name: "게시", exact: true }),
    ).toHaveCount(0);

    await asAdmin(context);
    await page.goto("/dev-logs");
    await expect(
      page.getByRole("link", { name: "게시", exact: true }),
    ).toHaveAttribute("href", "/dev-logs/new");
  });
});

test.describe("개발 일기 상세", () => {
  test("목록 2페이지에서 들어가면 [목록으로]가 page를 복원한다", async ({
    page,
  }) => {
    await page.goto("/dev-logs?page=2");
    await page.locator("article a[href^='/dev-logs/']").first().click();
    await expect(page).toHaveURL(/\/dev-logs\/[0-9a-f-]{36}\?page=2$/);

    await page.getByRole("link", { name: "목록으로" }).click();
    await expect(page).toHaveURL(/\/dev-logs\?page=2$/);
  });

  test("GitHub 링크는 새 탭으로 열리도록 표시된다", async ({ page }) => {
    // 최신 글(1페이지 첫 카드)이 GitHub 주소를 가진 시드다
    await page.goto(await firstDevLogPath(page));
    const link = page.getByRole("link", { name: "GitHub 저장소 열기" });
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("없는 id와 uuid가 아닌 id는 HTTP 404다", async ({ page }) => {
    for (const id of ["00000000-0000-4000-8000-000000000000", "없는-id"]) {
      const response = await page.goto(`/dev-logs/${id}`);
      expect(response?.status()).toBe(404);
    }
  });

  test("상세에 태그 칩이 표시된다(필터 링크 없는 표시 전용)", async ({
    page,
  }) => {
    await page.goto(await firstDevLogPath(page));
    // 최신 시드 글은 태그 3개(개발·Next.js·Supabase)가 붙어 있다
    for (const tag of ["개발", "Next.js", "Supabase"]) {
      await expect(page.getByText(tag, { exact: true })).toBeVisible();
    }
  });

  test("방문자에게는 [수정]/[삭제]가 없다", async ({ page }) => {
    await page.goto(await firstDevLogPath(page));
    await expect(page.getByRole("link", { name: "수정" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "삭제" })).toHaveCount(0);
  });
});
