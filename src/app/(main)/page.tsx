import { Suspense } from "react";
import { DevLogSection } from "@/components/dev-log-section";
import { MainPlaceholder } from "@/components/main-placeholder";
import { DevLogSkeleton, PostListSkeleton } from "@/components/main-skeletons";
import { PostListSection } from "@/components/post-list-section";
import { SectionErrorBoundary } from "@/components/section-error-boundary";
import { isDevOnlyOpen } from "@/lib/dev-gate";
import { parseListState, type RawSearchParams } from "@/lib/list-state";

/**
 * 메인 페이지. 게시글 영역과 개발 일기 영역을 각각 독립적으로 로딩·오류 처리한다.
 * 더미 게이트가 닫힌 프로덕션에서는 실데이터 연결(Task 018·019) 전까지 임시 화면을 보여준다.
 * @param searchParams tag·page 쿼리 (Next.js 16에서는 Promise)
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  if (!isDevOnlyOpen()) return <MainPlaceholder />;
  const { tag, page } = parseListState(await searchParams);

  return (
    <div className="container mx-auto flex max-w-6xl flex-col gap-12 px-4 py-8">
      <h1 className="sr-only">블로그</h1>
      <SectionErrorBoundary label="게시글">
        <Suspense fallback={<PostListSkeleton />}>
          <PostListSection tag={tag} page={page} />
        </Suspense>
      </SectionErrorBoundary>
      <SectionErrorBoundary label="개발 일기">
        <Suspense fallback={<DevLogSkeleton />}>
          <DevLogSection />
        </Suspense>
      </SectionErrorBoundary>
    </div>
  );
}
