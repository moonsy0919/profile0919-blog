import { notFound } from "next/navigation";

/**
 * 더미 데이터 기반 화면을 보여줘도 되는 환경인지 판정한다.
 * 프로덕션(NODE_ENV=production)이 아니면 true. 404가 아니라 화면을 나눠야 하는 경로(예: /)에서 쓴다.
 */
export function isDevOnlyOpen(): boolean {
  return process.env.NODE_ENV !== "production";
}

/**
 * 더미 데이터 기반 경로를 프로덕션에서 닫는다.
 * 프로덕션(NODE_ENV=production)이면 notFound()를 던지고, 개발·테스트 환경에서는 통과한다.
 * 상태 코드를 404로 확정하려면 Suspense·loading.tsx 경계보다 바깥인 layout에서 호출해야 한다.
 */
export function assertDevOnly(): void {
  if (!isDevOnlyOpen()) notFound();
}
