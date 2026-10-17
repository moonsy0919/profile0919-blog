import { PlaceholderPage } from "@/components/placeholder-page";
import { assertDevOnly } from "@/lib/dev-gate";

/** 게시글 작성(/posts/new). `new`는 예약된 slug다. */
export default function PostNewPage() {
  assertDevOnly();
  return <PlaceholderPage title="글 작성" />;
}
