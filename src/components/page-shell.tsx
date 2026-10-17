import { Header, type HeaderVariant } from "@/components/header";

/**
 * 헤더와 본문(main) 영역을 함께 렌더링하는 페이지 껍데기.
 * 헤더가 main 안에 들어가지 않도록 둘을 형제로 두며, 라우트 그룹 레이아웃과 404·오류 화면이 공유한다.
 * @param variant 헤더 종류
 */
export function PageShell({
  variant,
  children,
}: Readonly<{
  variant: HeaderVariant;
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header variant={variant} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </>
  );
}
