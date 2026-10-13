import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * 모든 요청에서 Supabase 세션을 갱신한다. 로그인과 무관한 공개 API인 `/api/weather`는
 * 클라이언트가 주기적으로 폴링하므로 매처에서 제외한다.
 * Next.js 16부터 `middleware.ts`는 `proxy.ts`로 이름이 바뀌었다 (기능은 동일).
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/weather$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
