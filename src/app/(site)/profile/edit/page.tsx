import { PlaceholderPage } from "@/components/placeholder-page";
import { assertDevOnly } from "@/lib/dev-gate";

/** 프로필 수정(/profile/edit). 관리자 전용이다. */
export default function ProfileEditPage() {
  assertDevOnly();
  return <PlaceholderPage title="프로필 수정" />;
}
