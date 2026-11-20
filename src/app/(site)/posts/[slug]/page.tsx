import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostDetail } from "@/components/post-detail";
import { PostForm } from "@/components/post-form";
import { getPost, getTags, getViewer } from "@/lib/data";
import { requireAdmin } from "@/lib/auth/require-admin";
import { assertDevOnly, isDevOnlyOpen } from "@/lib/dev-gate";
import {
  buildDetailMetadata,
  isEditMode,
  isEditRequested,
} from "@/lib/edit-mode";
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
 */
export async function generateMetadata({
  params,
  searchParams,
}: PostDetailPageProps): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  if (isEditRequested(sp)) assertDevOnly();
  const post = await getPost(slug);
  return post ? buildDetailMetadata(post.title, sp) : {};
}

/**
 * 게시글 상세(/posts/[slug]). 관리자가 edit=1로 들어오면 같은 URL에서 수정 모드로 바뀐다.
 * 읽기 모드는 실데이터라 프로덕션에도 열려 있다. 수정 모드(edit=1)와 관리자 [수정]·[삭제]는
 * 더미 액션을 쓰므로 Task 021에서 실연동하기 전까지 개발 환경에서만 연다.
 * 게이트와 notFound()는 Suspense 바깥에서 불러야 HTTP 404가 된다.
 */
export default async function PostDetailPage({
  params,
  searchParams,
}: PostDetailPageProps) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  if (isEditRequested(sp)) assertDevOnly();
  const post = await getPost(slug);
  if (!post) notFound();
  const detailPath = `/posts/${post.slug}`;
  const editHref = buildEditHref(detailPath, sp);
  // 비관리자의 edit=1은 로그인으로 보내고, 로그인하면 같은 수정 모드(edit=1·tag·page 유지)로 돌아온다
  if (isEditRequested(sp)) await requireAdmin(editHref);
  const viewer = await getViewer();

  // 수정 모드는 서버에서 분기해 읽기 뷰의 버튼·링크가 DOM에 남지 않게 한다
  if (isEditMode(sp, viewer)) {
    const tags = await getTags();
    return (
      <PostForm
        tags={tags}
        post={post}
        cancelHref={buildBackHref(detailPath, sp)}
        readQuery={buildBackHref("", sp)}
      />
    );
  }

  return (
    <PostDetail
      post={post}
      backHref={buildBackHref("/", sp)}
      isAdmin={viewer.isAdmin && isDevOnlyOpen()}
      editHref={editHref}
    />
  );
}
