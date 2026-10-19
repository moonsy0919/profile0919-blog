import { TAG_NAME_MAX } from "@/lib/validation/constants";

/** Next.js 페이지가 받는 searchParams 형태 (같은 키가 여러 번이면 배열) */
export type RawSearchParams = Record<string, string | string[] | undefined>;

/** 목록 상태. tag가 없으면 전체 보기, page는 항상 1 이상의 정수 */
export type ListState = {
  tag?: string;
  page: number;
};

/** buildListQuery·buildDetailHref가 받는 상태. 생략한 값은 기본값(전체·1페이지)으로 본다 */
export type ListStateInput = {
  tag?: string | null;
  page?: number | null;
};

/** 양의 정수 문자열만 인정하는 패턴. 소수·지수·공백·부호는 모두 걸러진다 */
const PAGE_PATTERN = /^[1-9]\d{0,8}$/;

/**
 * 같은 키가 여러 번 들어오면 첫 값만 쓴다.
 * @param value searchParams의 한 값
 */
function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * tag 쿼리를 정리한다. 앞뒤 공백을 지우고, 비었거나 태그 이름 한도보다 길면 무시한다.
 * @param value tag 쿼리 값
 */
function parseTag(value: string | undefined): string | undefined {
  const tag = value?.trim();
  return tag && tag.length <= TAG_NAME_MAX ? tag : undefined;
}

/**
 * page 쿼리를 정리한다. 양의 정수가 아니면 1페이지로 본다.
 * 마지막 페이지를 넘는 값의 보정은 전체 개수를 아는 조회 쪽(clampPage)이 맡는다.
 * @param value page 쿼리 값
 */
function parsePage(value: string | undefined): number {
  return value !== undefined && PAGE_PATTERN.test(value) ? Number(value) : 1;
}

/**
 * URL 쿼리에서 목록 상태(tag, page)를 읽는다. 잘못된 값은 무시하고 기본값으로 돌린다.
 * @param searchParams 페이지가 받은 searchParams
 */
export function parseListState(searchParams: RawSearchParams): ListState {
  const tag = parseTag(firstValue(searchParams.tag));
  const page = parsePage(firstValue(searchParams.page));
  return tag === undefined ? { page } : { tag, page };
}

/**
 * 목록 상태를 쿼리 문자열로 만든다. 기본값(전체·1페이지)은 생략하고,
 * 모두 기본값이면 빈 문자열을 돌려준다. 값이 있으면 "?"로 시작한다.
 * @param state 목록 상태
 */
export function buildListQuery(state: ListStateInput): string {
  const params = new URLSearchParams();
  const tag = parseTag(state.tag ?? undefined);
  if (tag) params.set("tag", tag);
  const page = state.page ?? 1;
  if (Number.isInteger(page) && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

/**
 * 목록 카드에서 상세로 가는 링크를 만든다. 현재 목록 상태를 쿼리로 함께 전달한다.
 * 개발 일기는 tag 없이 page만 넘기면 된다.
 * @param path 상세 경로 (예: /posts/hello-blog)
 * @param state 현재 목록 상태
 */
export function buildDetailHref(path: string, state: ListStateInput): string {
  return `${path}${buildListQuery(state)}`;
}

/**
 * 상세의 [목록으로] 링크를 만든다. 진입 때 전달된 tag/page를 복원하고,
 * 형식이 잘못됐거나 직접 접근이면 기본 목록 경로가 된다.
 * @param listPath 목록 경로 (게시글은 "/", 개발 일기는 "/dev-logs")
 * @param searchParams 상세 페이지가 받은 searchParams
 * @param options includeTag를 false로 두면 tag를 버린다 (개발 일기용)
 */
export function buildBackHref(
  listPath: string,
  searchParams: RawSearchParams,
  options: { includeTag?: boolean } = {},
): string {
  const { tag, page } = parseListState(searchParams);
  const includeTag = options.includeTag ?? true;
  return `${listPath}${buildListQuery({ tag: includeTag ? tag : undefined, page })}`;
}
