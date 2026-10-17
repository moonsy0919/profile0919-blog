import { PageShell } from "@/components/page-shell";

/** 메인을 제외한 모든 페이지 레이아웃: 압축형 헤더 */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PageShell variant="compact">{children}</PageShell>;
}
