import { DevLogForm } from "@/components/dev-log-form";
import { getTags } from "@/lib/data";
import { assertDevOnly } from "@/lib/dev-gate";

/** 개발 일기 게시(/dev-logs/new). */
export default async function DevLogNewPage() {
  assertDevOnly();
  const tags = await getTags();
  return <DevLogForm tags={tags} />;
}
