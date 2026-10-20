import { ExternalLink } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { ThumbnailImage } from "@/components/thumbnail-image";
import { Badge } from "@/components/ui/badge";
import type { DevLog } from "@/lib/data";
import { formatPostDate } from "@/lib/format-date";
import { buildDetailHref } from "@/lib/list-state";
import { extractExcerpt } from "@/lib/text/excerpt";

/** 카드에 보여줄 태그 칩의 최대 개수 */
const MAX_VISIBLE_TAGS = 3;

/**
 * 개발 일기 카드. 제목 링크가 카드 전체로 확장되어 어디를 눌러도 상세로 이동하고,
 * GitHub 링크는 그 위에 별도 앵커로 둬서 앵커가 중첩되지 않게 한다.
 * 개발 일기는 태그 필터가 없어 상세 링크에 page만 전달한다.
 * @param devLog 표시할 개발 일기
 * @param page 현재 페이지 번호 (1이면 쿼리에서 생략)
 */
export function DevLogCard({
  devLog,
  page,
}: {
  devLog: DevLog;
  page?: number;
}) {
  // typedRoutes는 문자열 변수 href에 Route 캐스팅을 요구한다
  const href = buildDetailHref(`/dev-logs/${devLog.id}`, { page }) as Route;
  const visibleTags = devLog.tags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenCount = devLog.tags.length - visibleTags.length;

  return (
    <article className="group relative overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring">
      <ThumbnailImage src={devLog.thumbnailUrl} />
      <div className="flex flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-lg font-semibold group-hover:text-primary">
          <Link
            href={href}
            className="outline-none after:absolute after:inset-0"
          >
            {devLog.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {extractExcerpt(devLog.content)}
        </p>
        {visibleTags.length > 0 && (
          <ul className="flex flex-wrap gap-1" aria-label="태그">
            {visibleTags.map((tag) => (
              <li key={tag.id}>
                <Badge variant="secondary">{tag.name}</Badge>
              </li>
            ))}
            {hiddenCount > 0 && (
              <li>
                <Badge variant="outline">+{hiddenCount}</Badge>
              </li>
            )}
          </ul>
        )}
        <div className="flex items-center justify-between gap-2">
          <time
            dateTime={devLog.createdAt}
            className="text-xs text-muted-foreground"
          >
            {formatPostDate(devLog.createdAt)}
          </time>
          {devLog.githubUrl && (
            <a
              href={devLog.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub 저장소 열기"
              className="relative z-10 inline-flex items-center gap-1 rounded text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              GitHub
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
