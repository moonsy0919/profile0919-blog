import { cache } from "react";
import { POST_PAGE_SIZE, clampPage } from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";
import type {
  GetPostsParams,
  PagedResult,
  Post,
  Tag,
  TagCounts,
} from "./types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/** posts + 연결된 태그를 한 번에 가져오는 select (표시용 태그 전체) */
const POST_COLUMNS =
  "id, slug, title, content, thumbnail_url, created_at, updated_at, post_tags(tags(id, name))";

/** 태그 필터용 조인. 표시용 post_tags와 별칭으로 분리해 글의 다른 태그가 잘리지 않게 한다 */
const TAG_FILTER_JOIN = "filter:post_tags!inner(tag_id)";

type PostRow = {
  id: string;
  slug: string;
  title: string;
  content: string;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  post_tags: { tags: Tag | null }[];
};

/**
 * 조회 실패를 예외로 바꾼다. "없음"(null·빈 결과)과 "실패"를 구분해
 * 오류 경계가 장애를 보여 주도록 한다.
 * @param what 실패한 조회 설명
 * @param cause 원본 오류
 */
function queryError(what: string, cause: unknown): Error {
  return new Error(`${what}에 실패했습니다`, { cause });
}

/**
 * DB 행을 도메인 Post로 바꾼다. 태그는 이름순으로 정렬한다.
 * @param row posts 행과 연결된 태그
 */
function toPost(row: PostRow): Post {
  const tags = row.post_tags
    .map((link) => link.tags)
    .filter((tag): tag is Tag => tag !== null)
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    thumbnailUrl: row.thumbnail_url,
    tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * LIKE 패턴의 특수문자(\, %, _)를 이스케이프해 태그 이름을 그대로 비교하게 한다.
 * @param name 태그 이름
 */
function escapeLike(name: string): string {
  return name.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * 태그 이름(대소문자 무시)으로 태그 id를 찾는다. 없으면 null.
 * @param supabase 서버 클라이언트
 * @param name 태그 이름
 */
async function findTagId(
  supabase: SupabaseClient,
  name: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("tags")
    .select("id")
    .ilike("name", escapeLike(name))
    .limit(1);
  if (error) throw queryError("태그 조회", error);
  return data[0]?.id ?? null;
}

/**
 * 공개 글 수를 센다. tagId가 있으면 그 태그가 붙은 글만 센다.
 * @param supabase 서버 클라이언트
 * @param tagId 태그 필터 (없으면 전체)
 */
async function countPosts(
  supabase: SupabaseClient,
  tagId: string | null,
): Promise<number> {
  const base = { count: "exact", head: true } as const;
  const query = tagId
    ? supabase
        .from("posts")
        .select("id, post_tags!inner(tag_id)", base)
        .eq("post_tags.tag_id", tagId)
    : supabase.from("posts").select("id", base);
  const { count, error } = await query.eq("published", true);
  if (error) throw queryError("게시글 수 조회", error);
  return count ?? 0;
}

/**
 * 최신순(created_at, id 내림차순)으로 한 페이지 범위의 공개 글을 조회한다.
 * @param supabase 서버 클라이언트
 * @param tagId 태그 필터 (없으면 전체)
 * @param from 시작 인덱스(포함)
 * @param to 끝 인덱스(포함)
 */
async function fetchPostRows(
  supabase: SupabaseClient,
  tagId: string | null,
  from: number,
  to: number,
): Promise<PostRow[]> {
  const columns = tagId ? `${POST_COLUMNS}, ${TAG_FILTER_JOIN}` : POST_COLUMNS;
  let query = supabase.from("posts").select(columns).eq("published", true);
  if (tagId) query = query.eq("filter.tag_id", tagId);
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to)
    .overrideTypes<PostRow[], { merge: false }>();
  if (error) throw queryError("게시글 목록 조회", error);
  return data;
}

/**
 * 게시글 목록을 최신순으로 조회한다. tag가 있으면 해당 태그 글만 보인다.
 * 없는 태그는 빈 결과이고, 범위를 벗어난 page는 보정된다.
 * @param params 태그 이름과 페이지 번호
 */
export async function getPosts(
  params: GetPostsParams = {},
): Promise<PagedResult<Post>> {
  const supabase = await createClient();
  const empty = { items: [], total: 0, page: 1, pageSize: POST_PAGE_SIZE };
  const tagId = params.tag ? await findTagId(supabase, params.tag) : null;
  if (params.tag && !tagId) return empty;
  const total = await countPosts(supabase, tagId);
  if (total === 0) return empty;
  const page = clampPage(params.page, total, POST_PAGE_SIZE);
  const from = (page - 1) * POST_PAGE_SIZE;
  const rows = await fetchPostRows(
    supabase,
    tagId,
    from,
    from + POST_PAGE_SIZE - 1,
  );
  return { items: rows.map(toPost), total, page, pageSize: POST_PAGE_SIZE };
}

/**
 * slug로 공개 게시글 한 건을 조회한다(수정 모드 초기값용 slug·썸네일·본문·태그 포함). 없으면 null.
 * React cache로 감싸 generateMetadata와 페이지가 한 요청 안에서 DB를 한 번만 부르게 한다.
 * @param slug 게시글 slug
 */
export const getPost = cache(async (slug: string): Promise<Post | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("published", true)
    .eq("slug", slug)
    .maybeSingle()
    .overrideTypes<PostRow, { merge: false }>();
  if (error) throw queryError("게시글 조회", error);
  return data ? toPost(data) : null;
});

/** 전체 태그 목록을 이름순으로 조회한다 (TagPicker 후보용) */
export async function getTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) throw queryError("태그 목록 조회", error);
  return data;
}

/**
 * 사이드바용 태그별 공개 글 개수를 조회한다. 글이 없는 태그는 DB 함수가 제외한다.
 * total은 "전체 보기"에 쓰는 공개 글 전체 수다.
 */
export async function getTagCounts(): Promise<TagCounts> {
  const supabase = await createClient();
  const [counts, total] = await Promise.all([
    supabase.rpc("get_post_tag_counts"),
    countPosts(supabase, null),
  ]);
  if (counts.error) throw queryError("태그 개수 조회", counts.error);
  const tags = counts.data.map((row) => ({
    tag: { id: row.tag_id, name: row.tag_name },
    count: Number(row.post_count),
  }));
  return { total, tags };
}
