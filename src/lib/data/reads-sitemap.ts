import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/** 사이트맵에 넣을 공개 글 정보 */
export type SitemapPost = {
  slug: string;
  updatedAt: string;
};

/**
 * 사이트맵용 공개 글 slug·수정일을 최신순으로 조회한다.
 * 쿠키를 읽지 않는 익명 클라이언트를 쓴다(공개 글은 RLS상 누구나 SELECT 가능).
 * 환경 변수가 없거나 조회가 실패하면 예외를 던지므로 호출하는 쪽에서 폴백한다.
 */
export async function getSitemapPosts(): Promise<SitemapPost[]> {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  const { data, error } = await supabase
    .from("posts")
    .select("slug, updated_at")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (error)
    throw new Error("사이트맵용 게시글 조회에 실패했습니다", { cause: error });
  return data.map((row) => ({ slug: row.slug, updatedAt: row.updated_at }));
}
