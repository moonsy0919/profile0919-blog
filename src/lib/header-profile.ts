import { siteConfig } from "@/config/site";
import type { Profile } from "@/lib/data";

/** 헤더에 표시할 프로필 값 */
export type HeaderProfile = {
  displayName: string;
  avatarUrl: string;
};

/**
 * 이미지 주소가 사이트 내부 경로(/)나 https 주소인지 확인한다.
 * 그 외 형식(javascript:, http: 등)은 헤더에 쓰지 않는다.
 * @param url 검사할 주소
 */
function isSafeAvatarUrl(url: string): boolean {
  return (
    (url.startsWith("/") && !url.startsWith("//")) || url.startsWith("https://")
  );
}

/**
 * 헤더 프로필을 정한다. DB 값이 비어 있거나 안전하지 않으면 siteConfig 기본값으로 대체한다.
 * @param profile 데이터 계층에서 조회한 프로필 (행이 없거나 조회에 실패하면 null)
 */
export function resolveHeaderProfile(profile: Profile | null): HeaderProfile {
  const defaults = siteConfig.profile;
  const avatarUrl = profile?.avatarUrl?.trim();
  return {
    displayName: profile?.displayName.trim() || defaults.displayName,
    avatarUrl:
      avatarUrl && isSafeAvatarUrl(avatarUrl) ? avatarUrl : defaults.avatarUrl,
  };
}
