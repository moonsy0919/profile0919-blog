import { Suspense } from "react";
import { DevLogListSection } from "@/components/dev-log-list-section";
import { DevLogSkeleton } from "@/components/main-skeletons";
import { parseListState, type RawSearchParams } from "@/lib/list-state";

/**
 * 개발 일기 목록(/dev-logs). 실데이터이며 4개/페이지이고 태그 필터는 없다.
 * @param searchParams page 쿼리 (Next.js 16에서는 Promise)
 */
export default async function DevLogsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const { page } = parseListState(await searchParams);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Suspense fallback={<DevLogSkeleton panel={false} />}>
        <DevLogListSection page={page} />
      </Suspense>
    </div>
  );
}
