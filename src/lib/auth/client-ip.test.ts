import { afterEach, describe, expect, it, vi } from "vitest";
import { extractClientIp, normalizeIp } from "./client-ip";

vi.mock("next/headers", () => ({ headers: vi.fn() }));

describe("normalizeIp", () => {
  it("IPv4는 그대로 돌려준다", () => {
    expect(normalizeIp("203.0.113.7")).toBe("203.0.113.7");
    expect(normalizeIp(" 203.0.113.7 ")).toBe("203.0.113.7");
  });

  it("IPv4로 매핑된 IPv6는 IPv4로 바꾼다", () => {
    expect(normalizeIp("::ffff:203.0.113.7")).toBe("203.0.113.7");
  });

  it("IPv6는 앞 64비트 접두사로 묶는다", () => {
    expect(normalizeIp("2001:db8:1:2:aaaa:bbbb:cccc:dddd")).toBe(
      "2001:db8:1:2::/64",
    );
    expect(normalizeIp("2001:0DB8:0001:0002::1")).toBe("2001:db8:1:2::/64");
    expect(normalizeIp("2001:db8::1")).toBe("2001:db8:0:0::/64");
  });

  it("같은 /64 안의 다른 주소는 같은 값이 된다", () => {
    expect(normalizeIp("2001:db8:1:2::1")).toBe(
      normalizeIp("2001:db8:1:2::ffff"),
    );
  });

  it("올바르지 않은 값은 null이다", () => {
    expect(normalizeIp("")).toBeNull();
    expect(normalizeIp("not-an-ip")).toBeNull();
    expect(normalizeIp("999.1.1.1")).toBeNull();
  });
});

describe("extractClientIp", () => {
  afterEach(() => vi.unstubAllEnvs());

  const from = (map: Record<string, string>) => (name: string) =>
    map[name] ?? null;

  it("x-forwarded-for의 첫 값을 쓴다", () => {
    const get = from({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(extractClientIp(get)).toBe("203.0.113.7");
  });

  it("x-forwarded-for가 없으면 x-real-ip를 쓴다", () => {
    expect(extractClientIp(from({ "x-real-ip": "203.0.113.8" }))).toBe(
      "203.0.113.8",
    );
  });

  it("헤더가 없으면 개발에서는 127.0.0.1, 운영에서는 unknown이다", () => {
    expect(extractClientIp(from({}))).toBe("127.0.0.1");
    vi.stubEnv("NODE_ENV", "production");
    expect(extractClientIp(from({}))).toBe("unknown");
  });
});
