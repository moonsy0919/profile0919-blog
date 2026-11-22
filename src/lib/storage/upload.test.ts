import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deleteImages,
  type StorageClient,
  UPLOAD_FAILED_MESSAGE,
  uploadImage,
} from "@/lib/storage/upload";

const PUBLIC_URL = "https://abc.supabase.co/storage/v1/object/public/x";

/** 버킷 동작을 흉내 내는 목 클라이언트를 만든다 */
function createMock(options: { uploadError?: unknown; removeError?: unknown }) {
  const upload = vi
    .fn()
    .mockResolvedValue({ error: options.uploadError ?? null });
  const remove = vi
    .fn()
    .mockResolvedValue({ error: options.removeError ?? null });
  const getPublicUrl = vi.fn((path: string) => ({
    data: { publicUrl: `${PUBLIC_URL}/${path}` },
  }));
  const from = vi.fn(() => ({ upload, remove, getPublicUrl }));
  const client = { storage: { from } } as unknown as StorageClient;
  return { client, from, upload, remove, getPublicUrl };
}

/** 지정한 형식·크기의 가짜 파일을 만든다 */
function makeFile(type = "image/png", size = 10) {
  const file = new File(["x"], "사진 1.png", { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("uploadImage", () => {
  it("검증을 통과하면 버킷에 올리고 공개 URL과 경로를 돌려준다", async () => {
    const mock = createMock({});
    const file = makeFile("image/webp");

    const result = await uploadImage(file, "posts", mock.client);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.path).toMatch(/^posts\/[0-9a-f-]{36}\.webp$/);
    expect(result.url).toBe(`${PUBLIC_URL}/${result.path}`);
    expect(mock.from).toHaveBeenCalledWith("thumbnails");
    expect(mock.upload).toHaveBeenCalledWith(result.path, file, {
      contentType: "image/webp",
      upsert: false,
    });
  });

  it("형식이 틀리면 업로드를 호출하지 않고 오류 문구를 돌려준다", async () => {
    const mock = createMock({});

    const result = await uploadImage(
      makeFile("image/svg+xml"),
      "posts",
      mock.client,
    );

    expect(result).toEqual({
      ok: false,
      message: "PNG, JPG, GIF, WEBP 형식의 이미지만 올릴 수 있습니다",
    });
    expect(mock.upload).not.toHaveBeenCalled();
  });

  it("5MB를 넘으면 업로드를 호출하지 않는다", async () => {
    const mock = createMock({});

    const result = await uploadImage(
      makeFile("image/png", 5 * 1024 * 1024 + 1),
      "profile",
      mock.client,
    );

    expect(result).toEqual({
      ok: false,
      message: "이미지는 5MB 이하로 올려 주세요",
    });
    expect(mock.upload).not.toHaveBeenCalled();
  });

  it("업로드가 실패하면 예외 없이 실패 결과를 돌려준다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const mock = createMock({ uploadError: { message: "denied" } });

    const result = await uploadImage(makeFile(), "dev-logs", mock.client);

    expect(result).toEqual({ ok: false, message: UPLOAD_FAILED_MESSAGE });
    expect(mock.getPublicUrl).not.toHaveBeenCalled();
  });

  it("업로드 중 예외가 나도 실패 결과로 바꾼다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const mock = createMock({});
    mock.upload.mockRejectedValue(new Error("network"));

    const result = await uploadImage(makeFile(), "posts", mock.client);

    expect(result).toEqual({ ok: false, message: UPLOAD_FAILED_MESSAGE });
  });
});

describe("deleteImages", () => {
  it("경로 목록으로 remove를 한 번 호출한다", async () => {
    const mock = createMock({});

    await deleteImages(["posts/a.png", "posts/b.png"], mock.client);

    expect(mock.from).toHaveBeenCalledWith("thumbnails");
    expect(mock.remove).toHaveBeenCalledWith(["posts/a.png", "posts/b.png"]);
  });

  it("목록이 비어 있으면 아무것도 호출하지 않는다", async () => {
    const mock = createMock({});

    await deleteImages([], mock.client);

    expect(mock.from).not.toHaveBeenCalled();
  });

  it("삭제가 실패해도 예외 없이 로그만 남긴다", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const mock = createMock({ removeError: { message: "denied" } });

    await expect(
      deleteImages(["posts/a.png"], mock.client),
    ).resolves.toBeUndefined();
    expect(log).toHaveBeenCalled();
  });

  it("삭제 중 예외가 나도 던지지 않는다", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const mock = createMock({});
    mock.remove.mockRejectedValue(new Error("network"));

    await expect(
      deleteImages(["posts/a.png"], mock.client),
    ).resolves.toBeUndefined();
    expect(log).toHaveBeenCalled();
  });
});
