import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/**
 * 404 화면의 본문(코드·제목·안내·[홈으로 돌아가기]).
 * 헤더는 포함하지 않는다. 헤더가 필요한 위치(루트 404)는 PageShell로 감싸고,
 * 그룹 레이아웃이 이미 헤더를 그리는 위치((site) 404)는 이 본문만 쓴다.
 */
export function NotFoundContent() {
  return (
    <div className="container mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-3xl font-bold tracking-tight">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="text-muted-foreground">
        주소가 잘못되었거나 페이지가 이동되었을 수 있습니다.
      </p>
      <Link href="/" className={buttonVariants({ size: "lg" })}>
        홈으로 돌아가기
      </Link>
    </div>
  );
}
