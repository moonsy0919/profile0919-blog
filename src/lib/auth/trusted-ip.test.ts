import { describe, expect, it } from "vitest";
import { addTrustedIp, isTrustedIp } from "./trusted-ip";
import { createFakeAdmin } from "./test-utils";

const DAY_MS = 86_400_000;
const daysAgo = (days: number) =>
  new Date(Date.now() - days * DAY_MS).toISOString();

describe("isTrustedIp", () => {
  it("알 수 없는 IP는 DB를 보지 않고 신뢰하지 않는다", async () => {
    const { admin, calls } = createFakeAdmin();
    expect(await isTrustedIp(admin, "u1", "unknown")).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it("등록되지 않은 IP는 신뢰하지 않는다", async () => {
    const { admin } = createFakeAdmin({
      "admin_trusted_ips.select": [{ data: null }],
    });
    expect(await isTrustedIp(admin, "u1", "1.2.3.4")).toBe(false);
  });

  it("최근에 쓴 신뢰 IP는 통과하고 마지막 사용 시각을 갱신한다", async () => {
    const { admin, calls } = createFakeAdmin({
      "admin_trusted_ips.select": [{ data: { last_used_at: daysAgo(10) } }],
    });
    expect(await isTrustedIp(admin, "u1", "1.2.3.4")).toBe(true);
    expect(calls.some((call) => call.op === "update")).toBe(true);
  });

  it("90일 넘게 쓰지 않은 IP는 삭제하고 신뢰하지 않는다", async () => {
    const { admin, calls } = createFakeAdmin({
      "admin_trusted_ips.select": [{ data: { last_used_at: daysAgo(91) } }],
    });
    expect(await isTrustedIp(admin, "u1", "1.2.3.4")).toBe(false);
    expect(calls.some((call) => call.op === "delete")).toBe(true);
    expect(calls.some((call) => call.op === "update")).toBe(false);
  });
});

describe("addTrustedIp", () => {
  it("사용자·IP 조합으로 upsert한다", async () => {
    const { admin, calls } = createFakeAdmin();
    await addTrustedIp(admin, "u1", "1.2.3.4");
    expect(calls[0].op).toBe("upsert");
    expect(calls[0].payload).toMatchObject({ user_id: "u1", ip: "1.2.3.4" });
  });

  it("알 수 없는 IP는 저장하지 않는다", async () => {
    const { admin, calls } = createFakeAdmin();
    await addTrustedIp(admin, "u1", "unknown");
    expect(calls).toHaveLength(0);
  });
});
