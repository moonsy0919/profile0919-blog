import { PostForm } from "@/components/post-form";
import { getTags } from "@/lib/data";
import { assertDevOnly } from "@/lib/dev-gate";

/** 게시글 작성(/posts/new). `new`는 예약된 slug다. */
export default async function PostNewPage() {
  assertDevOnly();
  const tags = await getTags();
  return <PostForm tags={tags} />;
}
