import { PlaceholderPage } from "@/components/placeholder-page";
import { assertDevOnly } from "@/lib/dev-gate";

/** 개발 일기 게시(/dev-logs/new) */
export default function DevLogNewPage() {
  assertDevOnly();
  return <PlaceholderPage title="개발 일기 게시" />;
}
