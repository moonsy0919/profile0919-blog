import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildObjectPath,
  isBucketImageUrl,
  objectPathFromPublicUrl,
} from "@/lib/storage/paths";

const BASE = "https://abc.supabase.co";
const PUBLIC = `${BASE}/storage/v1/object/public/thumbnails`;
const UUID_PATH =
  /^(posts|dev-logs|profile)\/[0-9a-f-]{36}\.(png|jpg|gif|webp)$/;

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", BASE);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("buildObjectPath", () => {
  it("폴더/uuid.확장자 형식의 경로를 만든다", () => {
    expect(buildObjectPath("posts", "image/png")).toMatch(UUID_PATH);
    expect(buildObjectPath("dev-logs", "image/jpeg")).toMatch(/\.jpg$/);
    expect(buildObjectPath("profile", "image/gif")).toMatch(/\.gif$/);
    expect(buildObjectPath("posts", "image/webp")).toMatch(/\.webp$/);
  });

  it("호출할 때마다 다른 경로를 만든다", () => {
    expect(buildObjectPath("posts", "image/png")).not.toBe(
      buildObjectPath("posts", "image/png"),
    );
  });

  it("허용하지 않는 MIME 형식이면 오류를 던진다", () => {
    expect(() => buildObjectPath("posts", "image/svg+xml")).toThrow();
    expect(() => buildObjectPath("posts", "text/plain")).toThrow();
  });
});

describe("objectPathFromPublicUrl", () => {
  it("이 버킷의 공개 URL이면 객체 경로를 돌려준다", () => {
    expect(objectPathFromPublicUrl(`${PUBLIC}/posts/a1.png`)).toBe(
      "posts/a1.png",
    );
    expect(objectPathFromPublicUrl(`${PUBLIC}/profile/a1.webp?t=1`)).toBe(
      "profile/a1.webp",
    );
  });

  it("외부 URL은 null이다", () => {
    expect(
      objectPathFromPublicUrl("https://example.com/posts/a1.png"),
    ).toBeNull();
    expect(
      objectPathFromPublicUrl(
        "https://other.supabase.co/storage/v1/object/public/thumbnails/posts/a1.png",
      ),
    ).toBeNull();
  });

  it("사이트 내부 경로·빈 값·잘못된 값은 null이다", () => {
    expect(objectPathFromPublicUrl("/default-thumbnail.svg")).toBeNull();
    expect(objectPathFromPublicUrl("")).toBeNull();
    expect(objectPathFromPublicUrl(null)).toBeNull();
    expect(objectPathFromPublicUrl(undefined)).toBeNull();
    expect(objectPathFromPublicUrl("not a url")).toBeNull();
  });

  it("다른 버킷이나 허용 폴더 밖 경로는 null이다", () => {
    expect(
      objectPathFromPublicUrl(
        `${BASE}/storage/v1/object/public/other/posts/a1.png`,
      ),
    ).toBeNull();
    expect(objectPathFromPublicUrl(`${PUBLIC}/misc/a1.png`)).toBeNull();
    expect(objectPathFromPublicUrl(`${PUBLIC}/a1.png`)).toBeNull();
  });

  it("하위 폴더·경로 탈출·인코딩된 슬래시는 null이다", () => {
    expect(objectPathFromPublicUrl(`${PUBLIC}/posts/x/a1.png`)).toBeNull();
    expect(objectPathFromPublicUrl(`${PUBLIC}/posts/..`)).toBeNull();
    expect(objectPathFromPublicUrl(`${PUBLIC}/posts/%2e%2e`)).toBeNull();
    expect(objectPathFromPublicUrl(`${PUBLIC}/posts%2Fa1.png`)).toBeNull();
  });

  it("folders로 허용 폴더를 좁힐 수 있다", () => {
    const url = `${PUBLIC}/profile/a1.png`;
    expect(objectPathFromPublicUrl(url, ["posts", "dev-logs"])).toBeNull();
    expect(objectPathFromPublicUrl(url, ["profile"])).toBe("profile/a1.png");
  });

  it("환경 변수가 없으면 null이다", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(objectPathFromPublicUrl(`${PUBLIC}/posts/a1.png`)).toBeNull();
  });
});

describe("isBucketImageUrl", () => {
  it("버킷 URL만 true다", () => {
    expect(isBucketImageUrl(`${PUBLIC}/dev-logs/a1.gif`)).toBe(true);
    expect(isBucketImageUrl("https://example.com/a.png")).toBe(false);
    expect(isBucketImageUrl("/default-avatar.svg")).toBe(false);
    expect(isBucketImageUrl(null)).toBe(false);
  });

  it("folders로 좁히면 다른 폴더는 false다", () => {
    expect(isBucketImageUrl(`${PUBLIC}/posts/a1.png`, ["profile"])).toBe(false);
  });
});
