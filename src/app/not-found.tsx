import { NotFoundContent } from "@/components/not-found-content";
import { PageShell } from "@/components/page-shell";

/**
 * 일치하는 경로가 없는 URL에 표시되는 404 페이지(압축형 헤더 포함).
 * 이 경로에는 그룹 레이아웃이 없어 헤더를 직접 그린다.
 * 그룹 안에서 notFound()가 호출되는 경우는 그 그룹의 not-found.tsx가 처리한다(헤더 중복 방지).
 */
export default function NotFound() {
  return (
    <PageShell variant="compact">
      <NotFoundContent />
    </PageShell>
  );
}
