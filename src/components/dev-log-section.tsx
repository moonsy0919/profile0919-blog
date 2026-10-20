import Link from "next/link";
import { DevLogCard } from "@/components/dev-log-card";
import { buttonVariants } from "@/components/ui/button";
import { getDevLogs, getViewer } from "@/lib/data";

/**
 * 메인 하단의 개발 일기 영역. 최신 개발 일기를 최대 한 페이지(4개)만 그리드로 보여준다.
 * 관리자 여부는 서버에서 분기해 방문자 HTML에는 [게시] 버튼이 포함되지 않는다.
 */
export async function DevLogSection() {
  const [devLogs, viewer] = await Promise.all([
    getDevLogs({ page: 1 }),
    getViewer(),
  ]);

  return (
    <section aria-labelledby="dev-log-heading" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="dev-log-heading" className="text-xl font-semibold">
          개발 일기
        </h2>
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
              <DevLogCard devLog={devLog} />
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/dev-logs"
        className={buttonVariants({
          variant: "outline",
          className: "self-center",
        })}
      >
        개발 일기 더 보기
      </Link>
    </section>
  );
}
