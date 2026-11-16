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
        <h3 className="truncate text-lg font-semibold group-hover:text-primary">
          <Link
            href={href}
            className="outline-none after:absolute after:inset-0"
          >
            {devLog.title}
          </Link>
        </h3>
        {/* min-h-[3lh]: 요약이 짧아도 3줄 높이를 차지해 아래 줄이 카드마다 같은 위치에 오게 한다 */}
        <p className="line-clamp-3 min-h-[3lh] text-sm text-muted-foreground">
          {extractExcerpt(devLog.content)}
        </p>
        {visibleTags.length > 0 ? (
          // -ml-2: 칩 안쪽 여백(px-2)만큼 당겨 칩 글자가 제목·요약·날짜의 왼쪽 선과 맞게 한다
          <ul
            className="-ml-2 flex h-5 gap-1 overflow-hidden"
            aria-label="태그"
          >
            {visibleTags.map((tag) => (
              <li key={tag.id} className="min-w-0">
                {/* 긴 태그 이름은 칩 안에서 말줄임 처리한다 */}
                <Badge variant="secondary" className="max-w-full shrink">
                  <span className="truncate">{tag.name}</span>
                </Badge>
              </li>
            ))}
            {hiddenCount > 0 && (
              <li className="shrink-0">
                <Badge variant="outline">+{hiddenCount}</Badge>
              </li>
            )}
          </ul>
        ) : (
          // 태그가 없어도 같은 높이를 비워 두어 날짜 줄 위치를 맞춘다
          <div className="h-5" aria-hidden="true" />
        )}
        <div className="flex min-h-4 items-center justify-between gap-2">
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
