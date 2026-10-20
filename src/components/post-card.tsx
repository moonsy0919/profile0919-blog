import type { Route } from "next";
import Link from "next/link";
import { ThumbnailImage } from "@/components/thumbnail-image";
import type { Post } from "@/lib/data";
import { formatPostDate } from "@/lib/format-date";
import { buildDetailHref } from "@/lib/list-state";
import { extractExcerpt } from "@/lib/text/excerpt";

/**
 * 게시글 카드. 카드 전체가 상세 링크이며, 현재 목록의 tag/page를 쿼리로 함께 전달한다.
 * @param post 표시할 게시글
 * @param tag 현재 선택된 태그 (없으면 전체)
 * @param page 현재 페이지 번호 (1이면 쿼리에서 생략)
 */
export function PostCard({
  post,
  tag,
  page,
}: {
  post: Post;
  tag?: string;
  page?: number;
}) {
  // typedRoutes는 문자열 변수 href에 Route 캐스팅을 요구한다
  const href = buildDetailHref(`/posts/${post.slug}`, { tag, page }) as Route;

  return (
    <article className="group overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring">
      <Link href={href} className="block outline-none">
        <ThumbnailImage src={post.thumbnailUrl} />
        <div className="flex flex-col gap-2 p-4">
          <h3 className="line-clamp-2 text-lg font-semibold group-hover:text-primary">
            {post.title}
          </h3>
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {extractExcerpt(post.content)}
          </p>
          <time
            dateTime={post.createdAt}
            className="text-xs text-muted-foreground"
          >
            {formatPostDate(post.createdAt)}
          </time>
        </div>
      </Link>
    </article>
  );
}
