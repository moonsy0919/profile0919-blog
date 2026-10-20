import { siteConfig } from "@/config/site";
import type { Profile } from "@/lib/data";

/** 헤더에 표시할 프로필 값 */
export type HeaderProfile = {
  displayName: string;
  avatarUrl: string;
};

/**
 * 헤더 프로필을 정한다. DB 값이 비어 있으면 siteConfig 기본값으로 대체한다.
 * @param profile 데이터 계층에서 조회한 프로필 (프로덕션처럼 DB를 쓰지 않으면 null)
 */
export function resolveHeaderProfile(profile: Profile | null): HeaderProfile {
  const defaults = siteConfig.profile;
  return {
    displayName: profile?.displayName.trim() || defaults.displayName,
    avatarUrl: profile?.avatarUrl || defaults.avatarUrl,
  };
}
