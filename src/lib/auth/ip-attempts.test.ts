import { describe, expect, it, vi } from "vitest";
import {
  countRecentBlocks,
  isIpBlocked,
  registerLoginFailure,
  resetLoginFailures,
} from "./ip-attempts";
import { createFakeAdmin } from "./test-utils";

describe("isIpBlocked", () => {
  it("blocked_at이 있으면 차단 중이다", async () => {
    const { admin } = createFakeAdmin({
      "admin_ip_attempts.select": [
        { data: { blocked_at: "2026-01-01T00:00:00Z" } },
      ],
    });
    expect(await isIpBlocked(admin, "1.2.3.4")).toBe(true);
  });

  it("행이 없거나 blocked_at이 비어 있으면 차단 중이 아니다", async () => {
    const { admin } = createFakeAdmin({
      "admin_ip_attempts.select": [
        { data: null },
        { data: { blocked_at: null } },
      ],
    });
    expect(await isIpBlocked(admin, "1.2.3.4")).toBe(false);
    expect(await isIpBlocked(admin, "1.2.3.4")).toBe(false);
  });
});

describe("registerLoginFailure", () => {
  it("DB 함수에 IP와 한도(5)를 넘기고 결과를 돌려준다", async () => {
    const { admin, calls } = createFakeAdmin({
      "rpc.register_login_failure": [
        { data: [{ blocked: true, newly_blocked: true }] },
      ],
    });
    expect(await registerLoginFailure(admin, "1.2.3.4")).toEqual({
      blocked: true,
      newlyBlocked: true,
    });
    expect(calls[0].payload).toEqual({ p_ip: "1.2.3.4", p_limit: 5 });
  });

  it("호출이 실패해도 던지지 않고 차단하지 않은 것으로 본다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { admin } = createFakeAdmin({
      "rpc.register_login_failure": [
        { data: null, error: { message: "boom" } },
      ],
    });
    expect(await registerLoginFailure(admin, "1.2.3.4")).toEqual({
      blocked: false,
      newlyBlocked: false,
    });
  });
});

describe("resetLoginFailures", () => {
  it("차단되지 않은 행의 횟수만 0으로 되돌린다", async () => {
    const { admin, calls } = createFakeAdmin();
    await resetLoginFailures(admin, "1.2.3.4");
    expect(calls[0].op).toBe("update");
    expect(calls[0].payload).toEqual({ consecutive_failures: 0 });
    expect(calls[0].filters).toEqual([
      ["eq", ["ip", "1.2.3.4"]],
      ["is", ["blocked_at", null]],
    ]);
  });
});

describe("countRecentBlocks", () => {
  it("최근 1시간 차단 수를 돌려준다", async () => {
    const { admin } = createFakeAdmin({
      "admin_ip_attempts.select": [{ count: 3 }],
    });
    expect(await countRecentBlocks(admin)).toBe(3);
  });
});
