import type { Route } from "next";
import Link from "next/link";
import type { TagCounts } from "@/lib/data";
import { buildListQuery } from "@/lib/list-state";
import { cn } from "@/lib/utils";

/** 항목 링크의 공통 스타일: 모바일은 칩, sm 이상은 세로 목록의 한 줄 */
const ITEM_CLASS =
  "flex shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-full border border-border px-3 py-1 text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:rounded-md sm:border-transparent sm:px-2 sm:py-1.5";
const ACTIVE_CLASS =
  "border-primary bg-primary text-primary-foreground hover:bg-primary/90 sm:border-transparent";

/**
 * 태그 목록 한 줄. 선택된 항목은 aria-current로 표시한다.
 * @param href 이동할 경로 (태그만 담고 page는 없다)
 * @param label 태그 이름 또는 "전체 보기"
 * @param count 해당 태그의 글 개수
 * @param current 현재 선택된 항목인지
 */
function TagItem({
  href,
  label,
  count,
  current,
}: {
  href: string;
  label: string;
  count: number;
  current: boolean;
}) {
  return (
    <li className="shrink-0">
      <Link
        href={href as Route}
        aria-current={current ? "true" : undefined}
        className={cn(ITEM_CLASS, current && ACTIVE_CLASS)}
      >
        <span>{label}</span>
        <span className={cn(!current && "text-muted-foreground")}>{count}</span>
      </Link>
    </li>
  );
}

/**
 * 태그 사이드바. "전체 보기 N"과 태그별 글 개수를 보여준다.
 * 모바일(sm 미만)에서는 가로 스크롤 칩 목록, 그 이상에서는 세로 목록이 된다.
 * 태그를 누르면 tag만 쿼리에 담고 page는 버려 1페이지로 돌아간다.
 * @param tagCounts 전체 글 개수와 태그별 개수
 * @param selectedTag 현재 선택된 태그 이름 (없으면 전체 보기)
 */
export function TagSidebar({
  tagCounts,
  selectedTag,
}: {
  tagCounts: TagCounts;
  selectedTag?: string;
}) {
  return (
    <nav aria-label="태그">
      <ul className="flex flex-row gap-2 overflow-x-auto pb-1 sm:flex-col sm:gap-1 sm:overflow-visible sm:pb-0">
        <TagItem
          href="/"
          label="전체 보기"
          count={tagCounts.total}
          current={!selectedTag}
        />
        {tagCounts.tags.map(({ tag, count }) => (
          <TagItem
            key={tag.id}
            href={`/${buildListQuery({ tag: tag.name })}`}
            label={tag.name}
            count={count}
            current={tag.name === selectedTag}
          />
        ))}
      </ul>
    </nav>
  );
}
