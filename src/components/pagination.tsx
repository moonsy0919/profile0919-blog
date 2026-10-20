import type { Route } from "next";
import Link from "next/link";
import { buildListQuery } from "@/lib/list-state";
import { getPageWindow } from "@/lib/pagination";
import { cn } from "@/lib/utils";

/** 번호·이전·다음 버튼의 공통 스타일 */
const BUTTON_CLASS =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-border px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring";
const LINK_CLASS = "hover:bg-muted";
const CURRENT_CLASS =
  "border-primary bg-primary text-primary-foreground hover:bg-primary/90";
const DISABLED_CLASS = "pointer-events-none opacity-50";

/**
 * 목록 페이지 링크를 만든다. 선택된 태그는 유지하고 1페이지는 page를 생략한다.
 * @param page 이동할 페이지 번호
 * @param tag 현재 선택된 태그
 */
function pageHref(page: number, tag?: string): Route {
  return `/${buildListQuery({ tag, page })}` as Route;
}

/**
 * 이전·다음 버튼. 이동할 페이지가 없으면 링크 대신 비활성 표시로 그린다.
 * @param label 버튼 글자
 * @param target 이동할 페이지 번호 (없으면 비활성)
 * @param tag 현재 선택된 태그
 */
function StepButton({
  label,
  target,
  tag,
}: {
  label: string;
  target: number | null;
  tag?: string;
}) {
  if (target === null) {
    return (
      <span aria-disabled="true" className={cn(BUTTON_CLASS, DISABLED_CLASS)}>
        {label}
      </span>
    );
  }
  return (
    <Link href={pageHref(target, tag)} className={cn(BUTTON_CLASS, LINK_CLASS)}>
      {label}
    </Link>
  );
}

/**
 * 페이지 이동 막대. 페이지가 많으면 현재 페이지 주변만 번호로 보여준다.
 * 페이지가 1개 이하면 아무것도 그리지 않는다.
 * @param page 현재 페이지 번호
 * @param totalPages 전체 페이지 수
 * @param tag 현재 선택된 태그 (링크에 함께 유지한다)
 */
export function Pagination({
  page,
  totalPages,
  tag,
}: {
  page: number;
  totalPages: number;
  tag?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="페이지 이동">
      <ul className="flex flex-wrap items-center justify-center gap-1">
        <li>
          <StepButton
            label="이전"
            target={page > 1 ? page - 1 : null}
            tag={tag}
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
                href={pageHref(item, tag)}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  BUTTON_CLASS,
                  item === page ? CURRENT_CLASS : LINK_CLASS,
                )}
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
          />
        </li>
      </ul>
    </nav>
  );
}
