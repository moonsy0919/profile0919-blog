import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditModePlaceholder } from "@/components/edit-mode-placeholder";
import { PostDetail } from "@/components/post-detail";
import { getPost, getViewer } from "@/lib/data";
import { assertDevOnly } from "@/lib/dev-gate";
import { buildDetailMetadata, isEditMode } from "@/lib/edit-mode";
import {
  buildBackHref,
  buildEditHref,
  type RawSearchParams,
} from "@/lib/list-state";

type PostDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
};

/**
 * 문서 제목과 색인 여부를 정한다. edit=1이 붙은 주소는 noindex다.
 * 프로덕션에서는 더미 글 제목이 새지 않도록 게이트를 먼저 확인한다.
 */
export async function generateMetadata({
  params,
  searchParams,
}: PostDetailPageProps): Promise<Metadata> {
  assertDevOnly();
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const post = await getPost(slug);
  return post ? buildDetailMetadata(post.title, sp) : {};
}

/**
 * 게시글 상세(/posts/[slug]). 관리자가 edit=1로 들어오면 같은 URL에서 수정 모드로 바뀐다.
 * 게이트와 notFound()는 Suspense 바깥에서 불러야 HTTP 404가 된다.
 */
export default async function PostDetailPage({
  params,
  searchParams,
}: PostDetailPageProps) {
  assertDevOnly();
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const post = await getPost(slug);
  if (!post) notFound();
  const viewer = await getViewer();
  const detailPath = `/posts/${post.slug}`;

  // 수정 모드는 서버에서 분기해 읽기 뷰의 버튼·링크가 DOM에 남지 않게 한다
  if (isEditMode(sp, viewer)) {
    return (
      <EditModePlaceholder
        kind="post"
        title={post.title}
        cancelHref={buildBackHref(detailPath, sp)}
      />
    );
  }

  return (
    <PostDetail
      post={post}
      backHref={buildBackHref("/", sp)}
      isAdmin={viewer.isAdmin}
      editHref={buildEditHref(detailPath, sp)}
    />
  );
}
