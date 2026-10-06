import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * 서버 컴포넌트/서버 액션에서 사용할 Supabase 클라이언트를 생성한다.
 * Server Component에서 호출되면 쿠키 쓰기가 무시될 수 있는데,
 * 세션 갱신은 `src/proxy.ts`가 담당하므로 문제가 되지 않는다.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component에서 호출된 경우 무시한다.
          }
        },
      },
    },
  );
}
