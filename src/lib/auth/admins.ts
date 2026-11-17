import type { AdminClient } from "@/lib/supabase/admin";

/**
 * 허용 목록(admin_allowlist)에 있는 사용자인지 서비스 키로 확인한다.
 * 승인 전 세션에서도 판정할 수 있도록 is_admin() RPC 대신 직접 조회한다.
 * @param admin 서비스 키 클라이언트
 * @param userId 사용자 id
 */
export async function isAllowlistedAdmin(
  admin: AdminClient,
  userId: string,
): Promise<boolean> {
  const { data } = await admin
    .from("admin_allowlist")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

/**
 * 허용 목록 관리자들의 이메일을 가져온다(세션이 없는 차단 알림 메일의 수신자).
 * @param admin 서비스 키 클라이언트
 */
export async function getAdminEmails(admin: AdminClient): Promise<string[]> {
  const { data } = await admin.from("admin_allowlist").select("user_id");
  const lookups = (data ?? []).map((row) =>
    admin.auth.admin.getUserById(row.user_id),
  );
  const users = await Promise.all(lookups);
  return users.flatMap((result) => result.data.user?.email ?? []);
}
