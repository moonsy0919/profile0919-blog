import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { AdminActions } from "@/components/admin-actions";
import { MarkdownContent } from "@/components/markdown-content";
import { ThumbnailImage } from "@/components/thumbnail-image";
import { Badge } from "@/components/ui/badge";
import type { Post } from "@/lib/data";
import { formatPostDate } from "@/lib/format-date";
import { buildDetailHref } from "@/lib/list-state";

type PostDetailProps = {
  post: Post;
  /** 상단 [목록으로] 링크 (진입 때 전달된 tag/page를 복원한 주소) */
  backHref: string;
  /** 관리자일 때만 맨 아래에 [수정]/[삭제]를 그린다 */
  isAdmin: boolean;
  /** 관리자 [수정] 링크 (같은 URL에 edit=1) */
  editHref: string;
};

/**
 * 작성일과, 수정된 적이 있으면 수정일을 함께 보여 준다.
 * @param post 표시할 게시글
 */
function PostDates({ post }: { post: Post }) {
  const edited = post.updatedAt !== post.createdAt;
  return (
    <p className="flex flex-wrap gap-x-3 text-sm text-muted-foreground">
      <span>
        작성{" "}
        <time dateTime={post.createdAt}>{formatPostDate(post.createdAt)}</time>
      </span>
      {edited && (
        <span>
          수정{" "}
          <time dateTime={post.updatedAt}>
            {formatPostDate(post.updatedAt)}
          </time>
        </span>
      )}
    </p>
  );
}

/**
 * 태그 칩 목록. 각 칩은 해당 태그로 필터한 메인 목록으로 이동한다.
 * @param tags 게시글의 태그
 */
function PostTags({ tags }: { tags: Post["tags"] }) {
  if (tags.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1" aria-label="태그">
      {tags.map((tag) => (
        <li key={tag.id}>
          <Link href={buildDetailHref("/", { tag: tag.name }) as Route}>
            <Badge variant="secondary">{tag.name}</Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * 게시글 상세(읽기 모드). 단일 컬럼으로 썸네일·제목·날짜·태그·마크다운 본문을 보여 준다.
 * 관리자 버튼은 서버에서 판정한 isAdmin이 true일 때만 DOM에 생긴다.
 */
export function PostDetail({
  post,
  backHref,
  isAdmin,
  editHref,
}: PostDetailProps) {
  return (
    <article className="container mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <Link
        href={backHref as Route}
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        목록으로
      </Link>
      <ThumbnailImage src={post.thumbnailUrl} className="rounded-lg" />
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold">{post.title}</h1>
        <PostDates post={post} />
        <PostTags tags={post.tags} />
      </header>
      <MarkdownContent content={post.content} />
      {isAdmin && <AdminActions kind="post" id={post.id} editHref={editHref} />}
    </article>
  );
}
