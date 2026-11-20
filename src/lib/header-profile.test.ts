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

  it("내부 경로와 https 이미지는 그대로 쓴다", () => {
    for (const avatarUrl of ["/uploads/me.png", "https://example.com/a.png"]) {
      const profile = { id: "1", displayName: "홍길동", avatarUrl };
      expect(resolveHeaderProfile(profile).avatarUrl).toBe(avatarUrl);
    }
  });

  it("안전하지 않은 이미지 주소는 기본 이미지로 대체한다", () => {
    const unsafe = [
      "javascript:alert(1)",
      "http://example.com/a.png",
      "//evil.com/a.png",
      "   ",
    ];
    for (const avatarUrl of unsafe) {
      const profile = { id: "1", displayName: "홍길동", avatarUrl };
      expect(resolveHeaderProfile(profile).avatarUrl).toBe(
        siteConfig.profile.avatarUrl,
      );
    }
  });
});
