import Link from "next/link";
import { DevLogCard } from "@/components/dev-log-card";
import { Pagination } from "@/components/pagination";
import { buttonVariants } from "@/components/ui/button";
import { getDevLogs, getViewer } from "@/lib/data";

/**
 * 개발 일기 목록 페이지의 본문. 4개/페이지 카드 그리드와 하단 페이지 번호를 그린다.
 * 범위를 벗어난 page는 조회 결과의 보정된 값을 써서 카드 링크와 페이지 번호에 반영한다.
 * 관리자 여부는 서버에서 분기해 방문자 HTML에는 [게시] 버튼이 포함되지 않는다.
 * @param page 요청한 페이지 번호
 */
export async function DevLogListSection({ page }: { page: number }) {
  const [devLogs, viewer] = await Promise.all([
    getDevLogs({ page }),
    getViewer(),
  ]);
  const totalPages = Math.ceil(devLogs.total / devLogs.pageSize);

  return (
    <section
      aria-labelledby="dev-log-list-heading"
      className="flex flex-col gap-6"
    >
      <div className="flex items-center justify-between gap-2">
        <h1 id="dev-log-list-heading" className="text-2xl font-semibold">
          개발 일기
        </h1>
        {viewer.isAdmin && (
          <Link href="/dev-logs/new" className={buttonVariants({ size: "sm" })}>
            게시
          </Link>
        )}
      </div>
      {devLogs.items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-muted-foreground">
          아직 작성된 개발 일기가 없습니다
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {devLogs.items.map((devLog) => (
            <li key={devLog.id} className="[&>article]:h-full">
              <DevLogCard devLog={devLog} page={devLogs.page} />
            </li>
          ))}
        </ul>
      )}
      <Pagination
        page={devLogs.page}
        totalPages={totalPages}
        basePath="/dev-logs"
      />
    </section>
  );
}
