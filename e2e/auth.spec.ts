import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import {
  createServiceClient,
  hasAdminSessionEnv,
  hasServiceKeyEnv,
  loginAsAdmin,
} from "./helpers/admin-session";

// 인증 E2E는 CI에 Supabase 시크릿과 관리자 계정이 없어 로컬 개발 서버에서만 실행한다.
test.skip(Boolean(process.env.CI), "인증 E2E는 로컬 전용");

const POST_EDIT = "/posts/hello-blog?page=2&edit=1";
const WRONG_LOGIN = "아이디 또는 비밀번호가 올바르지 않습니다";
const BLOCKED = "이 IP에서의 로그인이 차단되었습니다";

test.describe("비관리자 리디렉션", () => {
  for (const path of ["/posts/new", "/dev-logs/new", "/profile/edit"]) {
    test(`${path}는 /login?next=로 보낸다`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(`/login?next=${encodeURIComponent(path)}`);
      await expect(page.getByText("관리자 로그인이 필요합니다")).toBeVisible();
    });
  }

  test("상세 ?edit=1은 edit=1과 목록 쿼리를 next에 담아 보낸다", async ({
    page,
  }) => {
    await page.goto(POST_EDIT);
    await expect(page).toHaveURL(
      `/login?next=${encodeURIComponent(POST_EDIT)}`,
    );
  });
});

test.describe("관리자 세션", () => {
  test.skip(
    !hasAdminSessionEnv(),
    "E2E_ADMIN_EMAIL·E2E_ADMIN_PASSWORD·SUPABASE_SERVICE_ROLE_KEY(.env.local)가 필요합니다",
  );

  test("로그인 후 /login?next=는 같은 수정 모드로 돌려보낸다", async ({
    page,
    context,
  }) => {
    await page.goto(POST_EDIT);
    await expect(page).toHaveURL(/\/login\?next=/);
    const loginUrl = page.url();

    await loginAsAdmin(context);
    await page.goto(loginUrl);
    await expect(page).toHaveURL(POST_EDIT);
    await expect(page.getByLabel("제목")).not.toHaveValue("");
  });

  test("로그아웃하면 방문자로 돌아가고 관리 버튼이 사라진다", async ({
    page,
    context,
  }) => {
    await loginAsAdmin(context);
    await page.goto("/");
    await page.getByRole("button", { name: "로그아웃" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("link", { name: "로그인" })).toBeVisible();
    await expect(page.getByRole("button", { name: "로그아웃" })).toHaveCount(0);
  });
});

test("공개 키로 직접 로그인해도 승인 전에는 관리자가 아니다", async () => {
  test.skip(
    !hasAdminSessionEnv(),
    "E2E_ADMIN_EMAIL·E2E_ADMIN_PASSWORD·SUPABASE_SERVICE_ROLE_KEY(.env.local)가 필요합니다",
  );
  // 앱을 거치지 않고 Supabase에 직접 비밀번호 로그인 → 승인 기록이 없으므로 is_admin()은 false여야 한다
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { error } = await supabase.auth.signInWithPassword({
    email: process.env.E2E_ADMIN_EMAIL!,
    password: process.env.E2E_ADMIN_PASSWORD!,
  });
  expect(error).toBeNull();
  const { data } = await supabase.rpc("is_admin");
  expect(data).toBe(false);
  await supabase.auth.signOut();
});

test.describe("로그인 폼 (가짜 IP로 격리)", () => {
  test.skip(
    !hasServiceKeyEnv(),
    "서버가 쓰는 SUPABASE_SERVICE_ROLE_KEY가 필요합니다",
  );

  // 개발 서버는 x-forwarded-for를 그대로 읽는다. 테스트마다 문서용 대역(198.51.100.x)의 임의 IP를 써서
  // 실제 로컬 IP(127.0.0.1)가 차단되거나 신뢰 IP 기록이 섞이지 않게 한다.
  const fakeIp = `198.51.100.${1 + Math.floor(Math.random() * 250)}`;
  test.use({ extraHTTPHeaders: { "x-forwarded-for": fakeIp } });
  test.afterAll(async () => {
    await createServiceClient()
      .from("admin_ip_attempts")
      .delete()
      .eq("ip", fakeIp);
  });

  /** 로그인 폼을 채워 제출한다 */
  async function submitLogin(page: Page, email: string, password: string) {
    await page.goto("/login");
    await page.getByLabel("아이디(이메일)").fill(email);
    await page.getByLabel("비밀번호").fill(password);
    await page.getByRole("button", { name: "로그인" }).click();
  }

  test("틀린 비밀번호는 통일 문구로 실패한다", async ({ page }) => {
    await submitLogin(
      page,
      process.env.E2E_ADMIN_EMAIL ?? "admin@example.com",
      "wrong-password",
    );
    await expect(page.getByText(WRONG_LOGIN)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("등록되지 않은 아이디도 같은 문구로 실패한다", async ({ page }) => {
    await submitLogin(page, "nobody-e2e@example.com", "wrong-password");
    await expect(page.getByText(WRONG_LOGIN)).toBeVisible();
  });

  test("5회 연속 실패하면 그 IP는 차단 안내만 받는다", async ({ page }) => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await submitLogin(page, "nobody-e2e@example.com", "wrong-password");
      await expect(page.getByRole("alert")).toBeVisible();
    }
    await expect(page.getByText(BLOCKED)).toBeVisible();
    // 차단 뒤에는 올바른 정보로도 로그인 로직이 실행되지 않는다
    await submitLogin(
      page,
      process.env.E2E_ADMIN_EMAIL ?? "admin@example.com",
      "any",
    );
    await expect(page.getByText(BLOCKED)).toBeVisible();
  });

  test("새 IP에서는 올바른 ID/PW 뒤에 인증 코드 입력 단계가 나온다", async ({
    page,
  }) => {
    test.skip(
      !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
      "E2E_ADMIN_EMAIL·E2E_ADMIN_PASSWORD가 필요합니다",
    );
    test.skip(
      Boolean(process.env.RESEND_API_KEY),
      "실제 메일이 발송되므로 RESEND_API_KEY가 없을 때만 실행합니다",
    );
    await submitLogin(
      page,
      process.env.E2E_ADMIN_EMAIL!,
      process.env.E2E_ADMIN_PASSWORD!,
    );
    await expect(page.getByLabel("인증 코드")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
    await page.getByRole("button", { name: "취소" }).click();
    await expect(page.getByLabel("비밀번호")).toBeVisible();
  });
});

test("공개 키로 signUp을 호출해도 계정을 만들 수 없다", async () => {
  test.skip(
    !process.env.NEXT_PUBLIC_SUPABASE_URL,
    "Supabase 환경 변수가 필요합니다",
  );
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  const { data, error } = await supabase.auth.signUp({
    email: `e2e-signup-${Date.now()}@example.com`,
    password: "E2e-signup-Password-1!",
  });
  expect(error).not.toBeNull();
  expect(data.session).toBeNull();
});
