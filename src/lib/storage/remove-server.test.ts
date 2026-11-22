import { beforeEach, describe, expect, it, vi } from "vitest";

const { remove, createClient } = vi.hoisted(() => {
  const remove = vi.fn();
  const from = vi.fn(() => ({ remove }));
  return {
    remove,
    createClient: vi.fn(async () => ({ storage: { from } })),
  };
});
vi.mock("@/lib/supabase/server", () => ({ createClient }));

import { removeBucketImage } from "./remove-server";

const BUCKET =
  "https://example.supabase.co/storage/v1/object/public/thumbnails";

describe("removeBucketImage", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.spyOn(console, "error").mockImplementation(() => {});
    remove.mockReset().mockResolvedValue({ data: [{}], error: null });
    createClient.mockClear();
  });

  it("이 버킷의 지정 폴더 주소면 그 객체를 지운다", async () => {
    await removeBucketImage(`${BUCKET}/posts/a.png`, "posts");
    expect(remove).toHaveBeenCalledWith(["posts/a.png"]);
  });

  it("없음·외부 URL·내부 경로·다른 폴더는 Storage를 부르지 않는다", async () => {
    for (const url of [
      null,
      undefined,
      "",
      "https://evil.test/posts/a.png",
      "/dummy/a.png",
      `${BUCKET}/dev-logs/a.png`,
      `${BUCKET}/posts/sub/a.png`,
    ]) {
      await removeBucketImage(url, "posts");
    }
    expect(createClient).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it("삭제 오류·삭제된 객체 없음·예외는 던지지 않고 로그만 남긴다", async () => {
    remove.mockResolvedValue({ data: null, error: { message: "denied" } });
    await expect(
      removeBucketImage(`${BUCKET}/posts/a.png`, "posts"),
    ).resolves.toBeUndefined();
    remove.mockResolvedValue({ data: [], error: null });
    await expect(
      removeBucketImage(`${BUCKET}/posts/a.png`, "posts"),
    ).resolves.toBeUndefined();
    remove.mockRejectedValue(new Error("네트워크"));
    await expect(
      removeBucketImage(`${BUCKET}/posts/a.png`, "posts"),
    ).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledTimes(3);
  });
});
