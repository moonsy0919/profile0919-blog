import { describe, expect, it } from "vitest";
import { siteConfig } from "@/config/site";
import { resolveHeaderProfile } from "./header-profile";

describe("resolveHeaderProfile", () => {
  it("프로필이 없으면 siteConfig 기본값을 쓴다", () => {
    expect(resolveHeaderProfile(null)).toEqual(siteConfig.profile);
  });

  it("DB 값이 있으면 그대로 쓴다", () => {
    const profile = { id: "1", displayName: "홍길동", avatarUrl: "/a.png" };
    expect(resolveHeaderProfile(profile)).toEqual({
      displayName: "홍길동",
      avatarUrl: "/a.png",
    });
  });

  it("이름이 공백뿐이거나 이미지가 없으면 항목별로 기본값을 쓴다", () => {
    const profile = { id: "1", displayName: "   ", avatarUrl: null };
    expect(resolveHeaderProfile(profile)).toEqual(siteConfig.profile);
  });
});
