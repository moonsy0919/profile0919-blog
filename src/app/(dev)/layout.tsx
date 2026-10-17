import { assertDevOnly } from "@/lib/dev-gate";

/** 개발 전용 경로 레이아웃: 프로덕션에서는 본문 렌더링 전에 404로 닫는다 */
export default function DevLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  assertDevOnly();
  return children;
}
