import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "블로그",
  description: "블로그 글 목록",
};

/** Supabase posts 테이블에서 공개된 글 목록을 가져와 보여주는 블로그 페이지 */
export default async function PostsPage() {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, slug, title, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">블로그</h1>

      {error && (
        <p className="mt-4 text-destructive">
          글 목록을 불러오지 못했습니다: {error.message}
        </p>
      )}

      {!error && posts?.length === 0 && (
        <p className="mt-4 text-muted-foreground">아직 작성된 글이 없습니다.</p>
      )}

      {!error && posts && posts.length > 0 && (
        <ul className="mt-8 space-y-4">
          {posts.map((post) => (
            <li key={post.id} className="border-b pb-4">
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(post.created_at).toLocaleDateString("ko-KR")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
