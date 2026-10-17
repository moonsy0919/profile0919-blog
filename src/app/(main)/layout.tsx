import { PageShell } from "@/components/page-shell";

/** 메인(/) 전용 레이아웃: 확장형 헤더 */
export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PageShell variant="expanded">{children}</PageShell>;
}
