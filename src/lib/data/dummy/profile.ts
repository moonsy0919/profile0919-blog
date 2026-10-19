import type { Profile } from "../types";

/** 더미 프로필. 아바타가 없는 상태(기본 이미지 폴백)로 둔다 */
export const dummyProfile: Profile = {
  id: "profile-admin",
  displayName: "관리자",
  avatarUrl: null,
};
