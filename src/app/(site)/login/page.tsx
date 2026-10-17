import { PlaceholderPage } from "@/components/placeholder-page";
import { assertDevOnly } from "@/lib/dev-gate";

/** 관리자 로그인(/login). 사이트맵에는 포함하지 않는다. */
export default function LoginPage() {
  assertDevOnly();
  return <PlaceholderPage title="로그인" />;
}
