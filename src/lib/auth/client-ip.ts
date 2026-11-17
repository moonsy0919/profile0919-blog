import { isIP } from "node:net";
import { headers } from "next/headers";
import { UNKNOWN_IP } from "./constants";

/** IPv6 주소를 8개 그룹으로 펼친다. 형식이 이상하면 null */
function expandIpv6(ip: string): string[] | null {
  const head = ip.split("::")[0];
  const headParts = head ? head.split(":") : [];
  if (!ip.includes("::")) return headParts.length === 8 ? headParts : null;
  const tail = ip.split("::")[1];
  const tailParts = tail ? tail.split(":") : [];
  const missing = 8 - headParts.length - tailParts.length;
  if (missing < 1) return null;
  return [...headParts, ...Array<string>(missing).fill("0"), ...tailParts];
}

/** IPv6를 앞 64비트(/64)만 남긴 접두사 문자열로 바꾼다. 예: 2001:db8:1:2::/64 */
function toIpv6Prefix(ip: string): string | null {
  const groups = expandIpv6(ip);
  if (!groups) return null;
  const prefix = groups.slice(0, 4).map((group) => parseInt(group, 16));
  if (prefix.some((value) => Number.isNaN(value))) return null;
  return `${prefix.map((value) => value.toString(16)).join(":")}::/64`;
}

/**
 * IP 문자열을 저장·비교용으로 정규화한다.
 * IPv4는 그대로, IPv4로 매핑된 IPv6(::ffff:1.2.3.4)는 IPv4로, 일반 IPv6는 /64 접두사로 묶는다
 * (같은 집·통신사 대역 안에서 주소만 바꿔 차단·신뢰 판정을 우회하지 못하게 한다).
 * @param raw 헤더에서 읽은 IP 문자열
 * @returns 정규화한 값, 올바른 IP가 아니면 null
 */
export function normalizeIp(raw: string): string | null {
  const value = raw
    .trim()
    .replace(/^\[|\]$/g, "")
    .split("%")[0]
    .toLowerCase();
  const mapped = value.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  const candidate = mapped ? mapped[1] : value;
  const version = isIP(candidate);
  if (version === 4) return candidate;
  return version === 6 ? toIpv6Prefix(candidate) : null;
}

/**
 * 요청 헤더에서 방문자 IP를 고른다. Vercel은 x-forwarded-for를 직접 채워 외부에서 보낸 값을 덮어쓰므로
 * 첫 번째 값을 신뢰한다(Vercel 배포를 전제로 한다). 읽을 수 없으면 개발에서는 127.0.0.1, 운영에서는 unknown이다.
 * @param getHeader 헤더 값을 읽는 함수
 */
export function extractClientIp(
  getHeader: (name: string) => string | null,
): string {
  const forwarded = getHeader("x-forwarded-for")?.split(",")[0] ?? "";
  const ip =
    normalizeIp(forwarded) ?? normalizeIp(getHeader("x-real-ip") ?? "");
  if (ip) return ip;
  return process.env.NODE_ENV === "production" ? UNKNOWN_IP : "127.0.0.1";
}

/** 현재 요청의 방문자 IP(정규화됨)를 돌려준다 */
export async function getClientIp(): Promise<string> {
  const requestHeaders = await headers();
  return extractClientIp((name) => requestHeaders.get(name));
}
