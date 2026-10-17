import { PlaceholderPage } from "@/components/placeholder-page";
import { assertDevOnly } from "@/lib/dev-gate";

/** 게시글 상세(/posts/[slug]). 수정 화면은 같은 URL의 ?edit=1로 처리한다. */
export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  assertDevOnly();
  const { slug } = await params;
  return <PlaceholderPage title="게시글 상세" description={`slug: ${slug}`} />;
}
