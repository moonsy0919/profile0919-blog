import type { Metadata } from "next";
import { FormCardPage } from "@/components/form-card-page";
import { ProfileForm } from "@/components/profile-form";
import { getProfile } from "@/lib/data";
import { assertDevOnly } from "@/lib/dev-gate";

export const metadata: Metadata = {
  title: "프로필 수정",
  robots: { index: false },
};

/**
 * 프로필 수정(/profile/edit). 관리자 전용이다.
 * 게이트는 데이터 조회보다 먼저 확인하고, 현재 프로필을 폼 초기값으로 넘긴다.
 * 비관리자 리디렉션(/login?next=)은 Task 016에서 연결한다.
 */
export default async function ProfileEditPage() {
  assertDevOnly();
  const profile = await getProfile();
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
