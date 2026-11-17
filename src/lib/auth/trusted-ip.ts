import type { AdminClient } from "@/lib/supabase/admin";
import { TRUSTED_IP_IDLE_DAYS, UNKNOWN_IP } from "./constants";

const DAY_MS = 86_400_000;

/**
 * 이 IP가 해당 사용자의 신뢰 IP인지 확인한다. 쓸 때마다 마지막 사용 시각을 갱신하고,
 * 오래(TRUSTED_IP_IDLE_DAYS) 쓰지 않은 IP는 삭제하고 신뢰하지 않는다.
 * @param admin 서비스 키 클라이언트
 * @param userId 사용자 id
 * @param ip 정규화된 IP
 */
export async function isTrustedIp(
  admin: AdminClient,
  userId: string,
  ip: string,
): Promise<boolean> {
  if (ip === UNKNOWN_IP) return false;
  const { data } = await admin
    .from("admin_trusted_ips")
    .select("last_used_at")
    .eq("user_id", userId)
    .eq("ip", ip)
    .maybeSingle();
  if (!data) return false;

  const idleMs = Date.now() - new Date(data.last_used_at).getTime();
  const row = admin.from("admin_trusted_ips");
  if (idleMs > TRUSTED_IP_IDLE_DAYS * DAY_MS) {
    await row.delete().eq("user_id", userId).eq("ip", ip);
    return false;
  }
  await admin
    .from("admin_trusted_ips")
    .update({ last_used_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("ip", ip);
  return true;
}

/**
 * 이메일 인증을 통과한 IP를 신뢰 IP로 저장한다. 이미 있으면 마지막 사용 시각만 갱신한다.
 * @param admin 서비스 키 클라이언트
 * @param userId 사용자 id
 * @param ip 정규화된 IP (알 수 없는 IP는 저장하지 않는다)
 */
export async function addTrustedIp(
  admin: AdminClient,
  userId: string,
  ip: string,
): Promise<void> {
  if (ip === UNKNOWN_IP) return;
  const { error } = await admin
    .from("admin_trusted_ips")
    .upsert(
      { user_id: userId, ip, last_used_at: new Date().toISOString() },
      { onConflict: "user_id,ip" },
    );
  if (error) console.error("[auth] 신뢰 IP 저장 실패", error.message);
}
