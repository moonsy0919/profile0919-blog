import type { Route } from "next";
import Link from "next/link";
import { ThumbnailImage } from "@/components/thumbnail-image";
import type { Post } from "@/lib/data";
import { formatPostDate } from "@/lib/format-date";
import { buildDetailHref } from "@/lib/list-state";
import { extractExcerpt } from "@/lib/text/excerpt";

/**
 * 게시글 카드(테두리 없이 썸네일·한 줄 제목·3줄 요약·날짜). 카드 전체가 상세 링크이며, 현재 목록의 tag/page를 쿼리로 함께 전달한다.
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
    <article className="group rounded-lg has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-4">
      <Link href={href} className="block outline-none">
        <ThumbnailImage src={post.thumbnailUrl} />
        <div className="flex flex-col gap-3 pt-4">
          <h3 className="truncate text-xl font-semibold group-hover:text-primary">
            {post.title}
          </h3>
          {/* min-h-[3lh]: 요약이 짧아도 3줄 높이를 차지해 날짜가 모든 카드에서 같은 위치에 오게 한다 */}
          <p className="line-clamp-3 min-h-[3lh] text-base leading-relaxed text-muted-foreground">
            {extractExcerpt(post.content)}
          </p>
          <time
            dateTime={post.createdAt}
            className="pt-1 text-sm text-muted-foreground"
          >
            {formatPostDate(post.createdAt)}
          </time>
        </div>
      </Link>
    </article>
  );
}
