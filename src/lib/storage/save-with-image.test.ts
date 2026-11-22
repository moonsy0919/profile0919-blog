import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionResult } from "@/lib/data/types";

const { uploadImage, deleteImages } = vi.hoisted(() => ({
  uploadImage: vi.fn(),
  deleteImages: vi.fn(),
}));
vi.mock("@/lib/storage/upload", () => ({ uploadImage, deleteImages }));

import {
  isUploadFailure,
  saveWithImage,
  type SaveWithImageParams,
} from "@/lib/storage/save-with-image";

const BASE = "https://abc.supabase.co";
const OLD_URL = `${BASE}/storage/v1/object/public/thumbnails/posts/old.png`;
const NEW_URL = `${BASE}/storage/v1/object/public/thumbnails/posts/new.png`;
const file = new File(["x"], "a.png", { type: "image/png" });

const OK: ActionResult<{ id: string }> = { ok: true, data: { id: "1" } };
const FAILED: ActionResult<{ id: string }> = {
  ok: false,
  error: { code: "unknown", message: "실패" },
};

/** 기본 입력(작성 모드, 새 파일 있음)에 덮어쓸 값을 얹어 만든다 */
function params(
  overrides: Partial<SaveWithImageParams<{ id: string }>> = {},
): SaveWithImageParams<{ id: string }> {
  return {
    folder: "posts",
    file,
    removed: false,
    previousUrl: null,
    mode: "create",
    save: vi.fn().mockResolvedValue(OK),
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", BASE);
  vi.spyOn(console, "error").mockImplementation(() => {});
  uploadImage.mockReset().mockResolvedValue({
    ok: true,
    url: NEW_URL,
    path: "posts/new.png",
  });
  deleteImages.mockReset().mockResolvedValue(undefined);
});

describe("saveWithImage 작성 모드", () => {
  it("새 파일을 올리고 저장에는 주소 문자열만 넘긴다", async () => {
    const input = params();

    const result = await saveWithImage(input);

    expect(result).toEqual(OK);
    expect(uploadImage).toHaveBeenCalledWith(file, "posts");
    expect(input.save).toHaveBeenCalledWith(NEW_URL);
    expect(typeof vi.mocked(input.save).mock.calls[0][0]).toBe("string");
    expect(deleteImages).not.toHaveBeenCalled();
  });

  it("저장이 실패하면 방금 올린 객체를 지운다", async () => {
    const result = await saveWithImage(
      params({ save: vi.fn().mockResolvedValue(FAILED) }),
    );

    expect(result).toEqual(FAILED);
    expect(deleteImages).toHaveBeenCalledWith(["posts/new.png"]);
  });

  it("파일이 없으면 업로드하지 않고 null을 넘긴다", async () => {
    const input = params({ file: null });

    await saveWithImage(input);

    expect(uploadImage).not.toHaveBeenCalled();
    expect(input.save).toHaveBeenCalledWith(null);
    expect(deleteImages).not.toHaveBeenCalled();
  });
});

describe("saveWithImage 업로드 실패", () => {
  it("저장을 호출하지 않고 업로드 실패 결과를 돌려준다", async () => {
    uploadImage.mockResolvedValue({ ok: false, message: "올리지 못했습니다" });
    const input = params();

    const result = await saveWithImage(input);

    expect(input.save).not.toHaveBeenCalled();
    expect(deleteImages).not.toHaveBeenCalled();
    expect(isUploadFailure(result)).toBe(true);
    expect(result).toEqual({
      ok: false,
      uploadFailed: true,
      message: "올리지 못했습니다",
    });
  });

  it("서버 액션의 실패 결과는 업로드 실패로 분류하지 않는다", () => {
    expect(isUploadFailure(FAILED)).toBe(false);
    expect(isUploadFailure(OK)).toBe(false);
  });
});

describe("saveWithImage 수정 모드", () => {
  const update = { mode: "update", previousUrl: OLD_URL } as const;

  it("저장 성공 후 이전 객체를 지운다", async () => {
    const input = params(update);

    await saveWithImage(input);

    expect(input.save).toHaveBeenCalledWith(NEW_URL);
    expect(deleteImages).toHaveBeenCalledTimes(1);
    expect(deleteImages).toHaveBeenCalledWith(["posts/old.png"]);
  });

  it("저장 실패 시 새 객체만 지우고 이전 객체는 유지한다", async () => {
    await saveWithImage(
      params({ ...update, save: vi.fn().mockResolvedValue(FAILED) }),
    );

    expect(deleteImages).toHaveBeenCalledTimes(1);
    expect(deleteImages).toHaveBeenCalledWith(["posts/new.png"]);
  });

  it("이미지를 제거만 한 경우 저장 성공 후 이전 객체를 지우고 null을 넘긴다", async () => {
    const input = params({ ...update, file: null, removed: true });

    await saveWithImage(input);

    expect(input.save).toHaveBeenCalledWith(null);
    expect(deleteImages).toHaveBeenCalledWith(["posts/old.png"]);
  });

  it("제거만 하고 저장이 실패하면 아무것도 지우지 않는다", async () => {
    await saveWithImage(
      params({
        ...update,
        file: null,
        removed: true,
        save: vi.fn().mockResolvedValue(FAILED),
      }),
    );

    expect(deleteImages).not.toHaveBeenCalled();
  });

  it("이미지를 바꾸지 않았다면 기존 주소를 넘기고 아무것도 지우지 않는다", async () => {
    const input = params({ ...update, file: null });

    await saveWithImage(input);

    expect(input.save).toHaveBeenCalledWith(OLD_URL);
    expect(deleteImages).not.toHaveBeenCalled();
  });

  it("이전 주소가 외부 URL·내부 경로·null이면 지우지 않는다", async () => {
    for (const previousUrl of [
      "https://example.com/a.png",
      "/default-thumbnail.svg",
      null,
    ]) {
      await saveWithImage(params({ mode: "update", previousUrl }));
    }

    expect(deleteImages).not.toHaveBeenCalled();
  });
});

describe("saveWithImage 저장 호출 예외", () => {
  it("예외는 실패 결과로 바꾸고, 저장됐을 수 있으므로 객체를 지우지 않는다", async () => {
    const save = vi.fn().mockRejectedValue(new Error("network"));

    const result = await saveWithImage(
      params({ mode: "update", previousUrl: OLD_URL, save }),
    );

    expect(result.ok).toBe(false);
    expect(isUploadFailure(result)).toBe(false);
    expect(deleteImages).not.toHaveBeenCalled();
  });
});
