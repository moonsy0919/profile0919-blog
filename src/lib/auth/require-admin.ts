import type { Route } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/data";
import { sanitizeNext } from "./safe-next";

/**
 * 로그인 화면 주소를 만든다. 돌아올 경로는 내부 경로로 검증해 쿼리(edit=1 등)까지 담는다.
 * @param nextPath 로그인 후 돌아올 경로(쿼리 포함)
 */
export function buildLoginHref(nextPath: string): Route {
  return `/login?next=${encodeURIComponent(sanitizeNext(nextPath))}` as Route;
}

/**
 * 관리자만 통과시키는 가드. 비관리자는 `/login?next=`로 보낸다.
 * 작성·프로필 수정 페이지와 상세의 수정 모드(?edit=1)가 공통으로 쓴다.
 * Suspense·loading.tsx 경계보다 바깥에서 호출해야 리디렉션이 제대로 응답된다.
 * @param nextPath 로그인 후 돌아올 경로(쿼리 포함, 예: /posts/a?edit=1)
 */
export async function requireAdmin(nextPath: string): Promise<void> {
  const viewer = await getViewer();
  if (!viewer.isAdmin) redirect(buildLoginHref(nextPath));
}
