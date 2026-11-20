import type { Metadata } from "next";
import { FormCardPage } from "@/components/form-card-page";
import { ProfileForm } from "@/components/profile-form";
import { profileConfig } from "@/config/profile";
import { getProfile, type Profile } from "@/lib/data";
import { requireAdmin } from "@/lib/auth/require-admin";
import { assertDevOnly } from "@/lib/dev-gate";

export const metadata: Metadata = {
  title: "프로필 수정",
  robots: { index: false },
};

/** 프로필 행이 아직 없을 때 폼에 넘기는 초기값(이미지는 기본 이미지 상태) */
const emptyProfile: Profile = {
  id: "",
  displayName: profileConfig.displayName,
  avatarUrl: null,
};

/**
 * 프로필 수정(/profile/edit). 관리자 전용이다.
 * 게이트는 데이터 조회보다 먼저 확인하고, 현재 프로필을 폼 초기값으로 넘긴다.
 * 비관리자는 /login?next=/profile/edit로 보낸다.
 */
export default async function ProfileEditPage() {
  assertDevOnly();
  await requireAdmin("/profile/edit");
  const profile = (await getProfile()) ?? emptyProfile;
  return (
    <FormCardPage
      title="프로필 수정"
      description="헤더 중앙에 표시되는 이름과 이미지를 바꿉니다"
      width="lg"
    >
      <ProfileForm initialProfile={profile} />
    </FormCardPage>
  );
}
