import { cache } from "react";
import { PAGE_SIZE, clampPage } from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";
import { queryError } from "./reads-posts";
import type { DevLog, GetDevLogsParams, PagedResult, Tag } from "./types";

/** dev_logs + 연결된 태그를 한 번에 가져오는 select */
const DEV_LOG_COLUMNS =
  "id, title, content, thumbnail_url, github_url, created_at, updated_at, dev_log_tags(tags(id, name))";

/** id(uuid) 형식. 형식이 다른 값을 DB에 보내면 22P02 오류(500)가 되므로 미리 걸러낸다 */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DevLogRow = {
  id: string;
  title: string;
  content: string;
  thumbnail_url: string | null;
  github_url: string | null;
  created_at: string;
  updated_at: string;
  dev_log_tags: { tags: Tag | null }[];
};

/**
 * DB 행을 도메인 DevLog로 바꾼다. 태그는 이름순으로 정렬한다.
 * @param row dev_logs 행과 연결된 태그
 */
function toDevLog(row: DevLogRow): DevLog {
  const tags = row.dev_log_tags
    .map((link) => link.tags)
    .filter((tag): tag is Tag => tag !== null)
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    thumbnailUrl: row.thumbnail_url,
    githubUrl: row.github_url,
    tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * 개발 일기 목록을 최신순(created_at, id 내림차순)으로 조회한다.
 * 범위를 벗어난 page는 보정되고, 4개 미만이면 있는 만큼만 돌려준다.
 * dev_logs는 전부 공개라 published 필터가 없다.
 * @param params 페이지 번호
 */
export async function getDevLogs(
  params: GetDevLogsParams = {},
): Promise<PagedResult<DevLog>> {
  const supabase = await createClient();
  const empty = { items: [], total: 0, page: 1, pageSize: PAGE_SIZE };
  const { count, error: countError } = await supabase
    .from("dev_logs")
    .select("id", { count: "exact", head: true });
  if (countError) throw queryError("개발 일기 수 조회", countError);
  const total = count ?? 0;
  if (total === 0) return empty;
  const page = clampPage(params.page, total, PAGE_SIZE);
  const from = (page - 1) * PAGE_SIZE;
  const { data, error } = await supabase
    .from("dev_logs")
    .select(DEV_LOG_COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
    .overrideTypes<DevLogRow[], { merge: false }>();
  if (error) throw queryError("개발 일기 목록 조회", error);
  return { items: data.map(toDevLog), total, page, pageSize: PAGE_SIZE };
}

/**
 * id로 개발 일기 한 건을 조회한다(수정 모드 초기값용 GitHub URL·태그 포함). 없으면 null.
 * uuid 형식이 아닌 id는 DB를 부르지 않고 null이라 404가 된다.
 * React cache로 감싸 generateMetadata와 페이지가 한 요청 안에서 DB를 한 번만 부르게 한다.
 * @param id 개발 일기 id
 */
export const getDevLog = cache(async (id: string): Promise<DevLog | null> => {
  if (!UUID_PATTERN.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dev_logs")
    .select(DEV_LOG_COLUMNS)
    .eq("id", id)
    .maybeSingle()
    .overrideTypes<DevLogRow, { merge: false }>();
  if (error) throw queryError("개발 일기 조회", error);
  return data ? toDevLog(data) : null;
});
