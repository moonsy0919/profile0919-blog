import { Suspense } from "react";
import { DevLogListSection } from "@/components/dev-log-list-section";
import { DevLogSkeleton } from "@/components/main-skeletons";
import { assertDevOnly } from "@/lib/dev-gate";
import { parseListState, type RawSearchParams } from "@/lib/list-state";

/**
 * 개발 일기 목록(/dev-logs). 4개/페이지이고 태그 필터는 없다.
 * 게이트는 Suspense 바깥에서 불러야 프로덕션에서 HTTP 404가 된다.
 * @param searchParams page 쿼리 (Next.js 16에서는 Promise)
 */
export default async function DevLogsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  assertDevOnly();
  const { page } = parseListState(await searchParams);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Suspense fallback={<DevLogSkeleton />}>
        <DevLogListSection page={page} />
      </Suspense>
    </div>
  );
}
