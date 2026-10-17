import { PlaceholderPage } from "@/components/placeholder-page";
import { assertDevOnly } from "@/lib/dev-gate";

/** 개발 일기 목록(/dev-logs) */
export default function DevLogsPage() {
  assertDevOnly();
  return <PlaceholderPage title="개발 일기" />;
}
