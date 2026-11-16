import type { Route } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/** 종류별 화면 제목 */
const KIND_LABEL = { post: "게시글", devLog: "개발 일기" } as const;

/**
 * 수정 모드 자리. 상세가 같은 URL에서 읽기 뷰 대신 이 화면을 그린다.
 * 수정 폼은 Task 013에서 이 자리에 연결하며, 지금은 [취소]로 읽기 모드에 돌아갈 수만 있다.
 * [목록으로]·[수정]·[삭제]는 이 모드에서 보이지 않는다.
 * @param kind 수정할 대상 종류 (게시글 또는 개발 일기)
 * @param title 수정할 대상의 제목
 * @param cancelHref [취소] 링크 (edit만 제거하고 tag/page는 유지한 읽기 모드 주소)
 */
export function EditModePlaceholder({
  kind,
  title,
  cancelHref,
}: {
  kind: keyof typeof KIND_LABEL;
  title: string;
  cancelHref: string;
}) {
  return (
    <section
      aria-labelledby="edit-mode-heading"
      className="container mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8"
    >
      <h1 id="edit-mode-heading" className="text-2xl font-semibold">
        {KIND_LABEL[kind]} 수정
      </h1>
      <p className="text-muted-foreground">
        수정 중: {title}
        <br />
        수정 폼은 준비 중입니다.
      </p>
      <div className="flex justify-end">
        {/* typedRoutes는 문자열 변수 href에 Route 캐스팅을 요구한다 */}
        <Link
          href={cancelHref as Route}
          className={buttonVariants({ variant: "outline" })}
        >
          취소
        </Link>
      </div>
    </section>
  );
}
