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
