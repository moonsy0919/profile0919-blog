import { Suspense } from "react";
import { DevLogSection } from "@/components/dev-log-section";
import { DevLogSkeleton, PostListSkeleton } from "@/components/main-skeletons";
import { PostListSection } from "@/components/post-list-section";
import { SectionErrorBoundary } from "@/components/section-error-boundary";
import { isDevOnlyOpen } from "@/lib/dev-gate";
import { parseListState, type RawSearchParams } from "@/lib/list-state";

/**
 * 메인 페이지. 게시글 영역과 개발 일기 영역을 각각 독립적으로 로딩·오류 처리한다.
 * 게시글 영역은 실데이터라 프로덕션에도 열려 있다. 개발 일기 영역은 더미라 Task 019에서 실데이터로 바꿀 때까지 개발 환경에서만 보여준다.
 * @param searchParams tag·page 쿼리 (Next.js 16에서는 Promise)
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const { tag, page } = parseListState(await searchParams);

  return (
    <div className="container mx-auto flex max-w-6xl flex-col gap-12 px-4 py-8">
      <h1 className="sr-only">블로그</h1>
      <SectionErrorBoundary label="게시글">
        <Suspense fallback={<PostListSkeleton />}>
          <PostListSection tag={tag} page={page} />
        </Suspense>
      </SectionErrorBoundary>
      {isDevOnlyOpen() && (
        <SectionErrorBoundary label="개발 일기">
          <Suspense fallback={<DevLogSkeleton />}>
            <DevLogSection />
          </Suspense>
        </SectionErrorBoundary>
      )}
    </div>
  );
}
