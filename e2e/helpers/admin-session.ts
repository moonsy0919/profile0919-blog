import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { BrowserContext } from "@playwright/test";

/** E2E 로그인에 필요한 값은 로컬 .env.local에만 둔다(저장소 커밋 금지, CI에는 없다) */
try {
  process.loadEnvFile(".env.local");
} catch {
  // 파일이 없으면 이미 주입된 환경 변수만 쓴다
}

const BASE_URL = `http://localhost:${process.env.E2E_PORT ?? 3100}`;

/** 서비스 키로 보안 테이블을 다룰 수 있는지 본다(관리자 세션 승인·테스트 데이터 정리에 필요) */
export function hasServiceKeyEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/** 관리자 세션을 만드는 데 필요한 환경 변수가 모두 있는지 본다 */
export function hasAdminSessionEnv(): boolean {
  return Boolean(
    hasServiceKeyEnv() &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    process.env.E2E_ADMIN_EMAIL &&
    process.env.E2E_ADMIN_PASSWORD,
  );
}

/** 테스트 정리용 서비스 키 클라이언트 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

/** 액세스 토큰(JWT)에서 session_id 클레임을 꺼낸다 */
function readSessionId(accessToken: string): string {
  const payload = accessToken.split(".")[1];
  return JSON.parse(Buffer.from(payload, "base64url").toString()).session_id;
}

/** 로그인으로 만든 세션을 "승인됨"으로 기록한다(앱의 신뢰 IP 로그인과 같은 효과) */
async function approveSession(accessToken: string, userId: string) {
  const { error } = await createServiceClient()
    .from("admin_verified_sessions")
    .upsert({
      session_id: readSessionId(accessToken),
      user_id: userId,
      verified_via: "trusted_ip",
      ip: "127.0.0.1",
      expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    });
  if (error) throw new Error(`세션 승인 기록 실패: ${error.message}`);
}

/**
 * 관리자 ID/PW로 로그인하고 그 세션을 승인 기록한 뒤, 사이트가 읽는 세션 쿠키(@supabase/ssr 형식)를 만든다.
 * 매 테스트마다 화면에서 로그인하지 않도록 API로 한 번에 처리한다.
 */
async function createSessionCookies(): Promise<
  { name: string; value: string }[]
> {
  const jar = new Map<string, string>();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => [...jar].map(([name, value]) => ({ name, value })),
        setAll: (list) => list.forEach((c) => jar.set(c.name, c.value)),
      },
    },
  );
  const { data, error } = await supabase.auth.signInWithPassword({
    email: process.env.E2E_ADMIN_EMAIL!,
    password: process.env.E2E_ADMIN_PASSWORD!,
  });
  if (error || !data.session) {
    throw new Error("관리자 로그인 실패: E2E 계정 정보를 확인하세요");
  }
  await approveSession(data.session.access_token, data.user.id);
  return [...jar].map(([name, value]) => ({ name, value }));
}

/**
 * 브라우저 컨텍스트를 관리자로 로그인된 상태로 만든다.
 * @param context Playwright 브라우저 컨텍스트
 */
export async function loginAsAdmin(context: BrowserContext): Promise<void> {
  const cookies = await createSessionCookies();
  await context.addCookies(
    cookies.map(({ name, value }) => ({ name, value, url: BASE_URL })),
  );
}
