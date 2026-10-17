import { PlaceholderPage } from "@/components/placeholder-page";
import { assertDevOnly } from "@/lib/dev-gate";

/** 개발 일기 상세(/dev-logs/[id]). 수정 화면은 같은 URL의 ?edit=1로 처리한다. */
export default async function DevLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  assertDevOnly();
  const { id } = await params;
  return <PlaceholderPage title="개발 일기 상세" description={`id: ${id}`} />;
}
