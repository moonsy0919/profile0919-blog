import { ChevronRight, NotebookPen } from "lucide-react";
import Link from "next/link";
import { DevLogCard } from "@/components/dev-log-card";
import { buttonVariants } from "@/components/ui/button";
import { getDevLogs, getViewer } from "@/lib/data";

/**
 * 메인 하단의 개발 일기 영역. 최신 개발 일기를 최대 한 페이지(4개)만 그리드로 보여준다.
 * 영역 제목을 누르면 개발 일기 목록(/dev-logs)으로 이동한다.
 * 게시글 목록과 구분되도록 회색 패널 안에 아이콘 제목과 함께 담고, 카드는 테두리 있는 흰 카드로 둔다.
 * 관리자 여부는 서버에서 분기해 방문자 HTML에는 [게시] 버튼이 포함되지 않는다.
 */
export async function DevLogSection() {
  const [devLogs, viewer] = await Promise.all([
    getDevLogs({ page: 1 }),
    getViewer(),
  ]);

  return (
    <section
      aria-labelledby="dev-log-heading"
      className="flex flex-col gap-6 rounded-2xl bg-muted/60 p-5 sm:p-8"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="dev-log-heading" className="text-xl font-bold">
          {/* 제목 전체가 개발 일기 목록 링크다. 화살표는 눌러서 이동한다는 단서 */}
          <Link
            href="/dev-logs"
            className="group/title inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <NotebookPen className="size-5" aria-hidden="true" />
            </span>
            개발 일기
            <ChevronRight
              className="size-5 text-muted-foreground transition-transform group-hover/title:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </h2>
        {viewer.isAdmin && (
          <Link href="/dev-logs/new" className={buttonVariants({ size: "sm" })}>
            게시
          </Link>
        )}
      </div>
      {devLogs.items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-background px-4 py-12 text-center text-muted-foreground">
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
    </section>
  );
}
