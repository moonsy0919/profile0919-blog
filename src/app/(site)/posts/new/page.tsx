import { PostForm } from "@/components/post-form";
import { getTags } from "@/lib/data";
import { requireAdmin } from "@/lib/auth/require-admin";

/** 게시글 작성(/posts/new). `new`는 예약된 slug다. 관리자만 열 수 있고 비관리자는 로그인으로 보낸다(프로덕션에도 열림). */
export default async function PostNewPage() {
  await requireAdmin("/posts/new");
  const tags = await getTags();
  return <PostForm tags={tags} />;
}
