import { DevLogForm } from "@/components/dev-log-form";
import { getTags } from "@/lib/data";
import { requireAdmin } from "@/lib/auth/require-admin";
import { assertDevOnly } from "@/lib/dev-gate";

/** 개발 일기 게시(/dev-logs/new). */
export default async function DevLogNewPage() {
  assertDevOnly();
  await requireAdmin("/dev-logs/new");
  const tags = await getTags();
  return <DevLogForm tags={tags} />;
}
