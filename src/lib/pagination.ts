/** 목록 한 페이지에 보여줄 개수 (게시글·개발 일기 공통) */
export const PAGE_SIZE = 4;

/**
 * 요청한 page를 1 이상 마지막 페이지 이하로 보정한다.
 * 숫자가 아니거나 1 미만이면 1페이지로 본다.
 * @param page 요청한 페이지 번호
 * @param total 전체 항목 수
 * @param pageSize 페이지당 항목 수 (기본값 PAGE_SIZE)
 */
export function clampPage(
  page: number | undefined,
  total: number,
  pageSize: number = PAGE_SIZE,
): number {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const requested = Number.isInteger(page) ? (page as number) : 1;
  return Math.min(Math.max(requested, 1), lastPage);
}

/** 페이지 번호 목록의 한 항목: 페이지 번호 또는 생략 표시 */
export type PageWindowItem = number | "ellipsis";

/**
 * 페이지 번호 목록을 만든다. 첫·마지막 페이지와 현재 페이지 앞뒤 siblings개만 보여주고,
 * 그 사이가 비어 있으면 "ellipsis"를 넣는다.
 * @param current 현재 페이지 번호 (1 ~ total로 보정)
 * @param total 전체 페이지 수
 * @param siblings 현재 페이지 앞뒤로 보여줄 개수 (기본값 1)
 */
export function getPageWindow(
  current: number,
  total: number,
  siblings: number = 1,
): PageWindowItem[] {
  if (total <= 1) return [1];
  const page = Math.min(Math.max(current, 1), total);
  const pages = new Set([1, total]);
  for (let i = page - siblings; i <= page + siblings; i += 1) {
    if (i >= 1 && i <= total) pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((value, index) =>
    index > 0 && value - sorted[index - 1] > 1
      ? (["ellipsis", value] as PageWindowItem[])
      : [value],
  );
}
