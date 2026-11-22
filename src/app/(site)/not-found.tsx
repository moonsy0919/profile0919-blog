import { NotFoundContent } from "@/components/not-found-content";

/**
 * (site) 그룹 안에서 notFound()가 호출됐을 때(없는 글 slug·개발 일기 id, 프로덕션에서 닫힌 경로 등) 표시되는 404 페이지.
 * 이 그룹의 레이아웃(SiteLayout)이 이미 압축형 헤더와 main을 그리므로 여기서는 본문만 렌더링한다.
 * 루트 not-found.tsx처럼 헤더를 또 그리면 헤더와 main이 두 번 나온다.
 */
export default function SiteNotFound() {
  return <NotFoundContent />;
}
