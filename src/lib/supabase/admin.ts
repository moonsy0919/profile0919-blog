import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * 서비스 키(service role)로 Supabase에 접속하는 서버 전용 클라이언트.
 * RLS를 우회하므로 로그인 보안 테이블(신뢰 IP·차단·인증 코드·승인된 세션)을 다루는 서버 코드에서만 쓰고,
 * 브라우저로 나가는 코드에서는 절대 가져오지 않는다. 사용자 세션은 저장하지 않는다.
 * @throws 서비스 키가 설정되지 않았을 때
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다",
    );
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** 서비스 키 클라이언트 타입 */
export type AdminClient = ReturnType<typeof createAdminClient>;
