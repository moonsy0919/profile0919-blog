import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { buildListQuery } from "@/lib/list-state";
import { getPageWindow } from "@/lib/pagination";
import { cn } from "@/lib/utils";

/** 번호 링크의 공통 스타일: 테두리 없이 글자만, 현재 페이지는 진하게 */
const NUMBER_CLASS =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-2 text-base text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring";
const CURRENT_CLASS = "font-semibold text-foreground";
/** 이전·다음은 테두리가 있는 동그란 버튼 */
const STEP_CLASS =
  "inline-flex size-10 items-center justify-center rounded-full border border-border text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring";
const LINK_CLASS = "hover:bg-muted";
const DISABLED_CLASS = "pointer-events-none opacity-50";

/**
 * 목록 페이지 링크를 만든다. 선택된 태그는 유지하고 1페이지는 page를 생략한다.
 * @param page 이동할 페이지 번호
 * @param tag 현재 선택된 태그
 * @param basePath 목록 경로 (예: "/", "/dev-logs")
 */
function pageHref(page: number, tag: string | undefined, basePath: string) {
  return `${basePath}${buildListQuery({ tag, page })}` as Route;
}

/**
 * 이전·다음 버튼. 이동할 페이지가 없으면 링크 대신 비활성 표시로 그린다.
 * @param label 스크린 리더용 버튼 이름 ("이전" 또는 "다음")
 * @param target 이동할 페이지 번호 (없으면 비활성)
 * @param tag 현재 선택된 태그
 * @param basePath 목록 경로
 */
function StepButton({
  label,
  target,
  tag,
  basePath,
}: {
  label: string;
  target: number | null;
  tag?: string;
  basePath: string;
}) {
  const Icon = label === "이전" ? ChevronLeft : ChevronRight;
  const content = (
    <>
      <Icon className="size-5" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </>
  );
  if (target === null) {
    return (
      <span aria-disabled="true" className={cn(STEP_CLASS, DISABLED_CLASS)}>
        {content}
      </span>
    );
  }
  return (
    <Link
      href={pageHref(target, tag, basePath)}
      className={cn(STEP_CLASS, LINK_CLASS)}
    >
      {content}
    </Link>
  );
}

/**
 * 페이지 이동 막대. 페이지가 많으면 현재 페이지 주변만 번호로 보여준다.
 * 페이지가 1개 이하면 아무것도 그리지 않는다.
 * @param page 현재 페이지 번호
 * @param totalPages 전체 페이지 수
 * @param tag 현재 선택된 태그 (링크에 함께 유지한다)
 * @param basePath 목록 경로 (기본값 "/", 개발 일기 목록은 "/dev-logs")
 */
export function Pagination({
  page,
  totalPages,
  tag,
  basePath = "/",
}: {
  page: number;
  totalPages: number;
  tag?: string;
  basePath?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="페이지 이동">
      <ul className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
        <li>
          <StepButton
            label="이전"
            target={page > 1 ? page - 1 : null}
            tag={tag}
            basePath={basePath}
          />
        </li>
        {getPageWindow(page, totalPages).map((item, index) => (
          <li key={item === "ellipsis" ? `ellipsis-${index}` : item}>
            {item === "ellipsis" ? (
              <span aria-hidden="true" className="px-1 text-muted-foreground">
                …
              </span>
            ) : (
              <Link
                href={pageHref(item, tag, basePath)}
                aria-current={item === page ? "page" : undefined}
                className={cn(NUMBER_CLASS, item === page && CURRENT_CLASS)}
              >
                {item}
              </Link>
            )}
          </li>
        ))}
        <li>
          <StepButton
            label="다음"
            target={page < totalPages ? page + 1 : null}
            tag={tag}
            basePath={basePath}
          />
        </li>
      </ul>
    </nav>
  );
}
