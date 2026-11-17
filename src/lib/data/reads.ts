import { cache } from "react";
import { PAGE_SIZE, POST_PAGE_SIZE, clampPage } from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";
import { dummyDevLogs } from "./dummy/devLogs";
import { dummyPosts } from "./dummy/posts";
import { dummyProfile } from "./dummy/profile";
import { dummyTags } from "./dummy/tags";
import type {
  DevLog,
  GetDevLogsParams,
  GetPostsParams,
  PagedResult,
  Post,
  Profile,
  Tag,
  TagCounts,
  Viewer,
} from "./types";

export { PAGE_SIZE, POST_PAGE_SIZE };

/**
 * 최신순(createdAt 내림차순, 동점이면 id 내림차순)으로 정렬한 사본을 돌려준다.
 * @param items 정렬할 항목
 */
function sortLatest<T extends { id: string; createdAt: string }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) =>
      b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
  );
}

/**
 * 이미 정렬된 항목을 페이지 단위로 잘라 결과 형태로 만든다.
 * @param sorted 최신순으로 정렬된 전체 항목
 * @param page 요청한 페이지 번호
 * @param pageSize 페이지당 항목 수
 */
function paginate<T>(
  sorted: T[],
  page: number | undefined,
  pageSize: number,
): PagedResult<T> {
  const current = clampPage(page, sorted.length, pageSize);
  const start = (current - 1) * pageSize;
  return {
    items: sorted.slice(start, start + pageSize),
    total: sorted.length,
    page: current,
    pageSize,
  };
}

/**
 * 태그 이름을 대소문자 무시로 비교한다.
 * @param tags 항목에 붙은 태그
 * @param name 찾는 태그 이름
 */
function hasTagName(tags: Tag[], name: string): boolean {
  const target = name.toLowerCase();
  return tags.some((tag) => tag.name.toLowerCase() === target);
}

/**
 * 게시글 목록을 최신순으로 조회한다. tag가 있으면 해당 태그 글만 보인다.
 * 없는 태그는 빈 결과이고, 범위를 벗어난 page는 보정된다.
 * @param params 태그 이름과 페이지 번호
 */
export async function getPosts(
  params: GetPostsParams = {},
): Promise<PagedResult<Post>> {
  const { tag, page } = params;
  const filtered = tag
    ? dummyPosts.filter((post) => hasTagName(post.tags, tag))
    : dummyPosts;
  return paginate(sortLatest(filtered), page, POST_PAGE_SIZE);
}

/**
 * slug로 게시글 한 건을 조회한다. 없으면 null.
 * @param slug 게시글 slug
 */
export async function getPost(slug: string): Promise<Post | null> {
  return dummyPosts.find((post) => post.slug === slug) ?? null;
}

/** 전체 태그 목록을 조회한다 (TagPicker 후보용) */
export async function getTags(): Promise<Tag[]> {
  return [...dummyTags];
}

/**
 * 사이드바용 태그별 글 개수를 조회한다. 글이 없는 태그는 제외한다.
 * total은 "전체 보기"에 쓰는 전체 글 수다.
 */
export async function getTagCounts(): Promise<TagCounts> {
  const tags = dummyTags
    .map((tag) => ({
      tag,
      count: dummyPosts.filter((post) => post.tags.some((t) => t.id === tag.id))
        .length,
    }))
    .filter((entry) => entry.count > 0);
  return { total: dummyPosts.length, tags };
}

/**
 * 개발 일기 목록을 최신순으로 조회한다.
 * @param params 페이지 번호
 */
export async function getDevLogs(
  params: GetDevLogsParams = {},
): Promise<PagedResult<DevLog>> {
  return paginate(sortLatest(dummyDevLogs), params.page, PAGE_SIZE);
}

/**
 * id로 개발 일기 한 건을 조회한다. 없으면 null.
 * @param id 개발 일기 id
 */
export async function getDevLog(id: string): Promise<DevLog | null> {
  return dummyDevLogs.find((devLog) => devLog.id === id) ?? null;
}

/** 헤더 중앙에 표시할 프로필을 조회한다 */
export async function getProfile(): Promise<Profile> {
  return dummyProfile;
}

/**
 * 현재 보는 사람(방문자/관리자)을 조회한다.
 * 쿠키의 토큰은 getClaims()로 서명을 로컬 검증하고(getSession은 신뢰하지 않는다, 네트워크 호출 없음),
 * 승인된 세션인 관리자(is_admin)일 때만 관리자로 본다. 권한은 DB(is_admin)가 매번 판단하므로
 * 로그아웃·세션 삭제는 즉시 반영된다. 어느 단계든 실패하면 방문자다.
 * React cache로 감싸 한 요청 안에서 헤더·가드·페이지가 여러 번 불러도 DB 호출은 한 번만 한다.
 */
export const getViewer = cache(async (): Promise<Viewer> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims?.sub) return { isAdmin: false };
    const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");
    return { isAdmin: !rpcError && isAdmin === true };
  } catch {
    return { isAdmin: false };
  }
});
