import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";
import {
  generateCode,
  hashCode,
  issueChallenge,
  verifyChallenge,
} from "./challenge";
import { createFakeAdmin } from "./test-utils";

const target = { userId: "u1", sessionId: "s1", ip: "1.2.3.4" };
const minutesAgo = (m: number) =>
  new Date(Date.now() - m * 60_000).toISOString();
const minutesLater = (m: number) =>
  new Date(Date.now() + m * 60_000).toISOString();

beforeEach(() => vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-secret"));
afterEach(() => vi.unstubAllEnvs());

describe("generateCode / hashCode", () => {
  it("8자리 숫자 코드를 만든다", () => {
    for (let i = 0; i < 20; i += 1) expect(generateCode()).toMatch(/^\d{8}$/);
  });

  it("같은 코드는 같은 해시, 다른 코드는 다른 해시이며 평문이 아니다", () => {
    expect(hashCode("12345678")).toBe(hashCode("12345678"));
    expect(hashCode("12345678")).not.toBe(hashCode("12345679"));
    expect(hashCode("12345678")).not.toContain("12345678");
  });

  it("서비스 키가 없으면 던진다", () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(() => hashCode("12345678")).toThrow();
  });
});

describe("issueChallenge", () => {
  it("직전 발급 후 60초 안이면 cooldown으로 거절한다", async () => {
    const { admin } = createFakeAdmin({
      "admin_login_challenges.select": [
        { data: [{ created_at: minutesAgo(0.2) }] },
      ],
    });
    expect(await issueChallenge(admin, target)).toEqual({
      ok: false,
      reason: "cooldown",
    });
  });

  it("1시간 안에 5번 발급했으면 limit으로 거절한다", async () => {
    const rows = [2, 12, 22, 32, 42].map((m) => ({
      created_at: minutesAgo(m),
    }));
    const { admin } = createFakeAdmin({
      "admin_login_challenges.select": [{ data: rows }],
    });
    expect(await issueChallenge(admin, target)).toEqual({
      ok: false,
      reason: "limit",
    });
  });

  it("발급하면 이전 코드를 폐기하고 해시만 저장한다", async () => {
    const { admin, calls } = createFakeAdmin({
      "admin_login_challenges.select": [{ data: [] }],
    });
    const result = await issueChallenge(admin, target);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const insert = calls.find((call) => call.op === "insert");
    expect(insert?.payload).toMatchObject({
      user_id: "u1",
      session_id: "s1",
      ip: "1.2.3.4",
      code_hash: hashCode(result.code),
    });
    expect(JSON.stringify(insert?.payload)).not.toContain(result.code);
    expect(calls.some((call) => call.op === "update")).toBe(true);
  });
});

/** 검증 대상 행을 만든다 */
function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    ip: "1.2.3.4",
    code_hash: hashCode("12345678"),
    attempts: 0,
    expires_at: minutesLater(5),
    ...overrides,
  };
}

describe("verifyChallenge", () => {
  it("대기 중인 코드가 없으면 invalid", async () => {
    const { admin } = createFakeAdmin({
      "admin_login_challenges.select": [{ data: null }],
    });
    expect(await verifyChallenge(admin, target, "12345678")).toBe("invalid");
  });

  it("만료됐으면 invalid", async () => {
    const { admin } = createFakeAdmin({
      "admin_login_challenges.select": [
        { data: row({ expires_at: minutesAgo(1) }) },
      ],
    });
    expect(await verifyChallenge(admin, target, "12345678")).toBe("invalid");
  });

  it("오입력 한도(5회)에 도달했으면 invalid", async () => {
    const { admin } = createFakeAdmin({
      "admin_login_challenges.select": [{ data: row({ attempts: 5 }) }],
    });
    expect(await verifyChallenge(admin, target, "12345678")).toBe("invalid");
  });

  it("요청 때와 다른 IP면 ip_changed", async () => {
    const { admin } = createFakeAdmin({
      "admin_login_challenges.select": [{ data: row({ ip: "9.9.9.9" }) }],
    });
    expect(await verifyChallenge(admin, target, "12345678")).toBe("ip_changed");
  });

  it("틀린 코드는 mismatch이고 오입력 횟수를 1 올린다", async () => {
    const { admin, calls } = createFakeAdmin({
      "admin_login_challenges.select": [{ data: row({ attempts: 2 }) }],
    });
    expect(await verifyChallenge(admin, target, "00000000")).toBe("mismatch");
    const update = calls.find((call) => call.op === "update");
    expect(update?.payload).toEqual({ attempts: 3 });
  });

  it("5번째 오입력이면 코드를 폐기한다", async () => {
    const { admin, calls } = createFakeAdmin({
      "admin_login_challenges.select": [{ data: row({ attempts: 4 }) }],
    });
    await verifyChallenge(admin, target, "00000000");
    const update = calls.find((call) => call.op === "update");
    expect(update?.payload).toMatchObject({ attempts: 5 });
    expect(update?.payload).toHaveProperty("consumed_at");
  });

  it("맞는 코드는 ok이고 코드를 소진한다", async () => {
    const { admin, calls } = createFakeAdmin({
      "admin_login_challenges.select": [{ data: row() }],
      "admin_login_challenges.update": [{ data: [{ id: "c1" }] }],
    });
    expect(await verifyChallenge(admin, target, "12345678")).toBe("ok");
    expect(calls.find((call) => call.op === "update")?.payload).toHaveProperty(
      "consumed_at",
    );
  });

  it("동시에 다른 요청이 먼저 소진했으면 invalid (재사용 불가)", async () => {
    const { admin } = createFakeAdmin({
      "admin_login_challenges.select": [{ data: row() }],
      "admin_login_challenges.update": [{ data: [] }],
    });
    expect(await verifyChallenge(admin, target, "12345678")).toBe("invalid");
  });
});
