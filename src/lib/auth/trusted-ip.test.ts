import { describe, expect, it } from "vitest";
import { addTrustedIp, isTrustedIp } from "./trusted-ip";
import { createFakeAdmin } from "./test-utils";

const DAY_MS = 86_400_000;

describe("isTrustedIp", () => {
  it("알 수 없는 IP는 DB를 보지 않고 신뢰하지 않는다", async () => {
    const { admin, calls } = createFakeAdmin();
    expect(await isTrustedIp(admin, "u1", "unknown")).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it("등록되지 않았거나 만료된 IP는 갱신된 행이 없어 신뢰하지 않고 만료 행을 정리한다", async () => {
    const { admin, calls } = createFakeAdmin({
      "admin_trusted_ips.update": [{ data: [] }],
    });
    expect(await isTrustedIp(admin, "u1", "1.2.3.4")).toBe(false);
    const deleted = calls.find((call) => call.op === "delete");
    expect(deleted?.filters.map(([name]) => name)).toContain("lt");
  });

  it("만료 전 신뢰 IP는 한 번의 호출로 확인·갱신하고 통과한다", async () => {
    const { admin, calls } = createFakeAdmin({
      "admin_trusted_ips.update": [{ data: [{ ip: "1.2.3.4" }] }],
    });
    expect(await isTrustedIp(admin, "u1", "1.2.3.4")).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].op).toBe("update");
    expect(calls[0].payload).toHaveProperty("last_used_at");
  });

  it("갱신 조건에 90일 만료 기준(gte)이 들어간다", async () => {
    const { admin, calls } = createFakeAdmin({
      "admin_trusted_ips.update": [{ data: [{ ip: "1.2.3.4" }] }],
    });
    await isTrustedIp(admin, "u1", "1.2.3.4");
    const gte = calls[0].filters.find(([name]) => name === "gte");
    const [column, cutoff] = gte?.[1] as [string, string];
    expect(column).toBe("last_used_at");
    const idleDays = (Date.now() - new Date(cutoff).getTime()) / DAY_MS;
    expect(Math.round(idleDays)).toBe(90);
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
