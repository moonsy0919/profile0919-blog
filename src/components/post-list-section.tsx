import { PostCard } from "@/components/post-card";
import { PostListEmpty } from "@/components/post-list-empty";
import { Pagination } from "@/components/pagination";
import { TagSidebar } from "@/components/tag-sidebar";
import { getPosts, getTagCounts } from "@/lib/data";

/**
 * 메인의 게시글 영역. 좌측 태그 사이드바, 중앙 게시글 카드 목록, 하단 페이지 번호를 그린다.
 * 범위를 벗어난 page는 조회 결과의 보정된 값을 써서 카드 링크와 페이지 번호에 반영한다.
 * @param tag 선택된 태그 이름 (없으면 전체 보기)
 * @param page 요청한 페이지 번호
 */
export async function PostListSection({
  tag,
  page,
}: {
  tag?: string;
  page: number;
}) {
  const [posts, tagCounts] = await Promise.all([
    getPosts({ tag, page }),
    getTagCounts(),
  ]);
  const totalPages = Math.ceil(posts.total / posts.pageSize);

  return (
    <section
      aria-labelledby="post-list-heading"
      className="grid grid-cols-[minmax(0,1fr)] gap-6 sm:grid-cols-[12rem_minmax(0,1fr)]"
    >
      <h2 id="post-list-heading" className="sr-only">
        게시글
      </h2>
      <TagSidebar tagCounts={tagCounts} selectedTag={tag} />
      <div className="flex flex-col gap-6">
        {posts.items.length === 0 ? (
          <PostListEmpty tag={tag} />
        ) : (
          <ul className="flex flex-col gap-4">
            {posts.items.map((post) => (
              <li key={post.id}>
                <PostCard post={post} tag={tag} page={posts.page} />
              </li>
            ))}
          </ul>
        )}
        <Pagination page={posts.page} totalPages={totalPages} tag={tag} />
      </div>
    </section>
  );
}
