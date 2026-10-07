import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase 접속 정보를 환경 변수에서 읽는다.
 * @returns 둘 중 하나라도 비어 있으면 null
 */
function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return url && key ? { url, key } : null;
}

/**
 * 토큰 만료 시 자동 갱신을 위해 `getUser()`를 호출한다.
 * 실패해도 요청 자체는 막지 않고 서버 로그만 남긴다.
 */
async function refreshUser(supabase: ReturnType<typeof createServerClient>) {
  try {
    await supabase.auth.getUser();
  } catch (error) {
    console.error("[proxy] Supabase 세션 갱신에 실패했습니다.", error);
  }
}

/**
 * Supabase 세션 쿠키를 검사하고 필요하면 갱신한 뒤, 요청/응답에 반영한다.
 * 환경 변수 누락이나 Supabase 오류가 사이트 전체 500으로 번지지 않도록,
 * 세션 갱신만 건너뛰고 요청은 그대로 통과시킨다.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const env = getSupabaseEnv();
  if (!env) {
    console.error("[proxy] Supabase 환경 변수가 없어 세션 갱신을 건너뜁니다.");
    return supabaseResponse;
  }

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  await refreshUser(supabase);

  return supabaseResponse;
}
