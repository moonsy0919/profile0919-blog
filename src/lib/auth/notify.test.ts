import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminClient } from "@/lib/supabase/admin";

const { countRecentBlocks, getAdminEmails, sendMail } = vi.hoisted(() => ({
  countRecentBlocks: vi.fn(),
  getAdminEmails: vi.fn(),
  sendMail: vi.fn(),
}));

vi.mock("./ip-attempts", () => ({ countRecentBlocks }));
vi.mock("./admins", () => ({ getAdminEmails }));
vi.mock("./mailer", () => ({ sendMail }));

import { notifyBlocked, notifyNewTrustedIp } from "./notify";

const admin = {} as AdminClient;

beforeEach(() => {
  vi.resetAllMocks();
  getAdminEmails.mockResolvedValue(["admin@example.com"]);
  sendMail.mockResolvedValue(true);
});

describe("notifyBlocked", () => {
  it("관리자 이메일로 차단 알림을 보낸다", async () => {
    countRecentBlocks.mockResolvedValue(1);
    await notifyBlocked(admin, "1.2.3.4");
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0]).toMatchObject({
      to: "admin@example.com",
    });
  });

  it("최근 1시간 차단이 상한(5)을 넘으면 메일을 보내지 않는다", async () => {
    countRecentBlocks.mockResolvedValue(6);
    await notifyBlocked(admin, "1.2.3.4");
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("처리 중 오류가 나도 던지지 않는다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    countRecentBlocks.mockRejectedValue(new Error("db"));
    await expect(notifyBlocked(admin, "1.2.3.4")).resolves.toBeUndefined();
  });
});

describe("notifyNewTrustedIp", () => {
  it("발송이 실패해도 던지지 않는다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    sendMail.mockRejectedValue(new Error("mail"));
    await expect(
      notifyNewTrustedIp("a@b.c", "1.2.3.4"),
    ).resolves.toBeUndefined();
  });
});
