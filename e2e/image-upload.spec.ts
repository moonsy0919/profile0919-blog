import { expect, test, type Page, type Request } from "@playwright/test";
import {
  createServiceClient,
  hasAdminSessionEnv,
  loginAsAdmin,
} from "./helpers/admin-session";

// 실제 Storage·DB(운영 Supabase)를 쓰므로 로컬 전용이다.
test.skip(Boolean(process.env.CI), "실데이터(Storage·태그)를 쓰므로 로컬 전용");
test.skip(
  !hasAdminSessionEnv(),
  "관리자 세션·서비스 키용 환경 변수(.env.local)가 필요합니다",
);

/** 개발·운영이 같은 프로젝트라서 테스트가 만든 태그에는 이 접두어를 붙인다 */
const E2E_PREFIX = "[e2e]";
const STORAGE_UPLOAD = /\/storage\/v1\/object\/thumbnails\/(posts\/[^/?]+)/;
/** 서버 액션 본문에 섞여 들어가면 안 되는, 파일 안에만 있는 표식 */
const MARKER = "E2E_FILE_MARKER_5f3a9c";
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);
const IMAGE = {
  name: "e2e.png",
  mimeType: "image/png",
  buffer: Buffer.concat([PNG_1X1, Buffer.from(MARKER)]),
};

/** 이 테스트가 올린 객체 경로. 끝에서 서비스 키로 지운다 */
let uploadedPaths: string[] = [];

/** 테스트마다 다른 짧은 접미어 */
function suffix() {
  return String(Date.now()).slice(-6);
}

/** 페이지가 보내는 Storage 업로드 요청의 객체 경로를 기록한다 */
function trackUploads(page: Page) {
  page.on("request", (request) => {
    const match = request.url().match(STORAGE_UPLOAD);
    if (request.method() === "POST" && match) uploadedPaths.push(match[1]);
  });
}

/** 서버 액션 호출(POST + next-action 헤더)의 본문을 모은다 */
function trackServerActions(page: Page): Buffer[] {
  const bodies: Buffer[] = [];
  page.on("request", (request: Request) => {
    const isAction = "next-action" in request.headers();
    if (request.method() === "POST" && isAction) {
      bodies.push(request.postDataBuffer() ?? Buffer.alloc(0));
    }
  });
  return bodies;
}

/** 객체가 버킷에 있는지 서비스 키로 확인한다 */
async function objectExists(path: string): Promise<boolean> {
  const [folder, name] = path.split("/");
  const { data, error } = await createServiceClient()
    .storage.from("thumbnails")
    .list(folder, { search: name });
  if (error) throw new Error(`객체 조회 실패: ${error.message}`);
  return data.some((item) => item.name === name);
}

/** 객체의 내용을 서비스 키로 내려받아 문자열로 돌려준다 */
async function downloadText(path: string): Promise<string> {
  const { data, error } = await createServiceClient()
    .storage.from("thumbnails")
    .download(path);
  if (error || !data) throw new Error(`객체 다운로드 실패: ${error?.message}`);
  return Buffer.from(await data.arrayBuffer()).toString("latin1");
}

/** 이름이 일치하는 태그 행 수를 서비스 키로 센다 */
async function countTags(name: string): Promise<number> {
  const { data, error } = await createServiceClient()
    .from("tags")
    .select("id")
    .eq("name", name);
  if (error) throw new Error(`태그 조회 실패: ${error.message}`);
  return data.length;
}

/** 작성 폼에 필수 값과 이미지를 채운다 */
async function fillPostForm(page: Page, slug: string) {
  await page.goto("/posts/new");
  await page.getByLabel("제목").fill(`${E2E_PREFIX} 업로드`);
  await page.getByLabel("slug").fill(slug);
  await page.getByLabel("본문").fill("e2e 본문");
  await page.locator("#thumbnail-file").setInputFiles(IMAGE);
}

test.beforeEach(async ({ context }) => {
  uploadedPaths = [];
  await loginAsAdmin(context);
});

test.afterEach(async () => {
  const service = createServiceClient();
  if (uploadedPaths.length > 0) {
    await service.storage.from("thumbnails").remove(uploadedPaths);
  }
  // createPost가 실구현이라 저장 성공 테스트가 만든 글(post_tags는 cascade)도 지운다
  await service.from("posts").delete().like("title", `${E2E_PREFIX}%`);
  await service.from("tags").delete().like("name", `${E2E_PREFIX}%`);
});

test.describe("썸네일 직접 업로드", () => {
  test("저장하면 브라우저가 Storage에 올리고, 서버 액션 본문에는 파일이 없다", async ({
    page,
  }) => {
    trackUploads(page);
    const actionBodies = trackServerActions(page);
    const slug = `e2e-upload-${suffix()}`;
    await fillPostForm(page, slug);

    const upload = page.waitForResponse(
      (res) =>
        res.request().method() === "POST" && STORAGE_UPLOAD.test(res.url()),
    );
    await page.getByRole("button", { name: "저장" }).click();
    expect((await upload).ok()).toBe(true);
    await expect(page.getByText("글이 저장되었습니다")).toBeVisible();

    expect(uploadedPaths).toHaveLength(1);
    expect(await objectExists(uploadedPaths[0])).toBe(true);
    // 대조군: 표식은 Storage에 올라간 파일에는 있고(브라우저가 FormData 파일 바이트를 노출하지 않아 객체로 확인),
    // 서버 액션 본문에는 없다. 본문이 실제로 수집됐음은 slug 포함 여부로 확인한다
    expect(await downloadText(uploadedPaths[0])).toContain(MARKER);
    expect(actionBodies.length).toBeGreaterThan(0);
    expect(actionBodies.some((body) => body.includes(slug))).toBe(true);
    expect(actionBodies.some((body) => body.includes(MARKER))).toBe(false);
  });

  test("저장이 실패하면 방금 올린 객체를 지운다", async ({ page }) => {
    trackUploads(page);
    // 실데이터에 이미 있는 slug(시드 글)면 createPost가 conflict로 실패한다
    await fillPostForm(page, "hello-world");

    const upload = page.waitForResponse(
      (res) =>
        res.request().method() === "POST" && STORAGE_UPLOAD.test(res.url()),
    );
    const removal = page.waitForResponse(
      (res) =>
        res.request().method() === "DELETE" &&
        res.url().includes("/storage/v1/object/thumbnails"),
    );
    await page.getByRole("button", { name: "저장" }).click();
    expect((await upload).ok()).toBe(true);
    expect((await removal).ok()).toBe(true);

    await expect(page.getByText("이미 사용 중인 slug입니다.")).toBeVisible();
    await expect(page).toHaveURL(/\/posts\/new$/);
    expect(uploadedPaths).toHaveLength(1);
    await expect.poll(() => objectExists(uploadedPaths[0])).toBe(false);
  });

  test("업로드가 실패하면 저장하지 않고 안내하며 입력값을 유지한다", async ({
    page,
  }) => {
    const actionBodies = trackServerActions(page);
    await page.route(STORAGE_UPLOAD, (route) => route.abort());
    await fillPostForm(page, `e2e-fail-${suffix()}`);

    await page.getByRole("button", { name: "저장" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "이미지를 올리지 못했습니다" }),
    ).toBeVisible();
    expect(actionBodies).toHaveLength(0);
    await expect(page).toHaveURL(/\/posts\/new$/);
    await expect(page.getByLabel("제목")).toHaveValue(`${E2E_PREFIX} 업로드`);
  });
});

test.describe("태그 [추가]", () => {
  const SEARCH = "태그 검색 또는 새 태그 입력";

  test("새 태그를 등록하고 바로 선택한다", async ({ page }) => {
    const name = `${E2E_PREFIX}New${suffix()}`;
    await page.goto("/posts/new");
    await page.getByPlaceholder(SEARCH).fill(name);
    await page.getByRole("button", { name: "추가" }).click();

    await expect(page.getByLabel(`${name} 태그 제거`)).toBeVisible();
    expect(await countTags(name)).toBe(1);
  });

  test("대소문자만 다른 이름은 새로 만들지 않고 기존 태그를 선택하며 토스트로 알린다", async ({
    page,
  }) => {
    const name = `${E2E_PREFIX}Dup${suffix()}`;
    await page.goto("/posts/new");
    // 화면의 태그 목록이 만들어진 뒤에 같은 이름의 태그가 생긴 상황(목록이 오래된 경우)을 만든다
    const { error } = await createServiceClient().from("tags").insert({ name });
    expect(error).toBeNull();

    await page.getByPlaceholder(SEARCH).fill(name.toUpperCase());
    await page.getByRole("button", { name: "추가" }).click();

    await expect(
      page.getByText("이미 있는 태그라서 기존 태그를 선택했습니다"),
    ).toBeVisible();
    await expect(page.getByLabel(`${name} 태그 제거`)).toBeVisible();
    const { data } = await createServiceClient()
      .from("tags")
      .select("id")
      .ilike("name", name);
    expect(data).toHaveLength(1);
  });
});
