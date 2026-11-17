import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CODE_EXPIRED_MESSAGE,
  CODE_MISMATCH_MESSAGE,
  CODE_RESEND_LIMITED_MESSAGE,
  LOGIN_BLOCKED_MESSAGE,
  LOGIN_FAILED_MESSAGE,
  LOGIN_UNAVAILABLE_MESSAGE,
} from "./constants";
import type { ActionResult } from "@/lib/data/types";
import { createFakeAdmin } from "./test-utils";

const m = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getClaims: vi.fn(),
  getClientIp: vi.fn(),
  isIpBlocked: vi.fn(),
  registerLoginFailure: vi.fn(),
  resetLoginFailures: vi.fn(),
  isTrustedIp: vi.fn(),
  addTrustedIp: vi.fn(),
  isAllowlistedAdmin: vi.fn(),
  issueChallenge: vi.fn(),
  verifyChallenge: vi.fn(),
  sendMail: vi.fn(),
  notifyBlocked: vi.fn(),
  notifyNewTrustedIp: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      signInWithPassword: m.signInWithPassword,
      signOut: m.signOut,
      getClaims: m.getClaims,
    },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: m.createAdminClient,
}));
vi.mock("./client-ip", () => ({ getClientIp: m.getClientIp }));
vi.mock("./ip-attempts", () => ({
  isIpBlocked: m.isIpBlocked,
  registerLoginFailure: m.registerLoginFailure,
  resetLoginFailures: m.resetLoginFailures,
}));
vi.mock("./trusted-ip", () => ({
  isTrustedIp: m.isTrustedIp,
  addTrustedIp: m.addTrustedIp,
}));
vi.mock("./admins", () => ({ isAllowlistedAdmin: m.isAllowlistedAdmin }));
vi.mock("./challenge", () => ({
  issueChallenge: m.issueChallenge,
  verifyChallenge: m.verifyChallenge,
}));
vi.mock("./mailer", () => ({ sendMail: m.sendMail }));
vi.mock("./notify", () => ({
  notifyBlocked: m.notifyBlocked,
  notifyNewTrustedIp: m.notifyNewTrustedIp,
}));

import { runLogin, runResendCode, runVerifyCode } from "./login-flow";

const values = { email: "admin@example.com", password: "pw" };
const claims = { sub: "u1", session_id: "s1", email: "admin@example.com" };
let fake: ReturnType<typeof createFakeAdmin>;

beforeEach(() => {
  vi.resetAllMocks();
  fake = createFakeAdmin();
  m.createAdminClient.mockReturnValue(fake.admin);
  m.getClientIp.mockResolvedValue("1.2.3.4");
  m.isIpBlocked.mockResolvedValue(false);
  m.registerLoginFailure.mockResolvedValue({
    blocked: false,
    newlyBlocked: false,
  });
  m.signInWithPassword.mockResolvedValue({ error: null });
  m.signOut.mockResolvedValue({ error: null });
  m.getClaims.mockResolvedValue({ data: { claims } });
  m.isAllowlistedAdmin.mockResolvedValue(true);
  m.isTrustedIp.mockResolvedValue(false);
  m.issueChallenge.mockResolvedValue({ ok: true, code: "12345678" });
  m.sendMail.mockResolvedValue(true);
});

/** 실패 결과의 문구를 꺼낸다 */
const messageOf = <T>(result: ActionResult<T>) =>
  result.ok ? null : result.error.message;

describe("runLogin — 차단과 실패", () => {
  it("차단된 IP는 로그인 로직을 실행하지 않고 차단 안내만 돌려준다", async () => {
    m.isIpBlocked.mockResolvedValue(true);
    const result = await runLogin(values);
    expect(messageOf(result)).toBe(LOGIN_BLOCKED_MESSAGE);
    expect(m.signInWithPassword).not.toHaveBeenCalled();
    expect(m.registerLoginFailure).not.toHaveBeenCalled();
  });

  it("비밀번호가 틀리면 실패를 기록하고 통일 문구를 돌려준다", async () => {
    m.signInWithPassword.mockResolvedValue({ error: { message: "bad" } });
    const result = await runLogin(values);
    expect(messageOf(result)).toBe(LOGIN_FAILED_MESSAGE);
    expect(m.registerLoginFailure).toHaveBeenCalledWith(fake.admin, "1.2.3.4");
  });

  it("5번째 실패로 새로 차단되면 차단 안내를 주고 알림 메일을 보낸다", async () => {
    m.signInWithPassword.mockResolvedValue({ error: { message: "bad" } });
    m.registerLoginFailure.mockResolvedValue({
      blocked: true,
      newlyBlocked: true,
    });
    const result = await runLogin(values);
    expect(messageOf(result)).toBe(LOGIN_BLOCKED_MESSAGE);
    expect(m.notifyBlocked).toHaveBeenCalledWith(fake.admin, "1.2.3.4");
  });

  it("허용 목록 밖 계정은 즉시 로그아웃하고 같은 문구로 실패하며 실패로 센다", async () => {
    m.isAllowlistedAdmin.mockResolvedValue(false);
    const result = await runLogin(values);
    expect(messageOf(result)).toBe(LOGIN_FAILED_MESSAGE);
    expect(m.signOut).toHaveBeenCalledTimes(1);
    expect(m.registerLoginFailure).toHaveBeenCalled();
  });

  it("허용 목록 밖 계정은 신뢰 IP여도 통과하지 못한다(두 확인을 동시에 해도 결과는 같다)", async () => {
    m.isAllowlistedAdmin.mockResolvedValue(false);
    m.isTrustedIp.mockResolvedValue(true);
    const result = await runLogin(values);
    expect(messageOf(result)).toBe(LOGIN_FAILED_MESSAGE);
    expect(fake.calls.some((c) => c.table === "admin_verified_sessions")).toBe(
      false,
    );
    expect(m.signOut).toHaveBeenCalledTimes(1);
  });

  it("형식이 틀린 입력은 Supabase를 부르지 않고 실패로 센다", async () => {
    const result = await runLogin({ email: "admin", password: "" });
    expect(messageOf(result)).toBe(LOGIN_FAILED_MESSAGE);
    expect(m.signInWithPassword).not.toHaveBeenCalled();
    expect(m.registerLoginFailure).toHaveBeenCalled();
  });
});

describe("runLogin — 신뢰 IP와 새 IP", () => {
  it("신뢰 IP는 코드 없이 로그인되고 세션 승인·프로필·실패 초기화가 일어난다", async () => {
    m.isTrustedIp.mockResolvedValue(true);
    const result = await runLogin(values, "/posts/a?edit=1");
    expect(result).toEqual({
      ok: true,
      data: { status: "done", redirectTo: "/posts/a?edit=1" },
    });
    const approved = fake.calls.find(
      (c) => c.table === "admin_verified_sessions",
    );
    expect(approved?.payload).toMatchObject({
      session_id: "s1",
      user_id: "u1",
      verified_via: "trusted_ip",
      ip: "1.2.3.4",
    });
    expect(fake.calls.some((c) => c.table === "profiles")).toBe(true);
    expect(m.resetLoginFailures).toHaveBeenCalledWith(fake.admin, "1.2.3.4");
    expect(m.issueChallenge).not.toHaveBeenCalled();
  });

  it("외부 next는 /로 바꾼다", async () => {
    m.isTrustedIp.mockResolvedValue(true);
    const result = await runLogin(values, "https://evil.com");
    expect(result).toEqual({
      ok: true,
      data: { status: "done", redirectTo: "/" },
    });
  });

  it("새 IP는 코드를 메일로 보내고 코드 입력 단계로 넘기며 승인하지 않는다", async () => {
    const result = await runLogin(values);
    expect(result).toEqual({ ok: true, data: { status: "code_required" } });
    expect(m.sendMail.mock.calls[0][0]).toMatchObject({
      to: "admin@example.com",
    });
    expect(m.sendMail.mock.calls[0][0].text).toContain("12345678");
    expect(fake.calls.some((c) => c.table === "admin_verified_sessions")).toBe(
      false,
    );
    expect(m.resetLoginFailures).not.toHaveBeenCalled();
    expect(m.signOut).not.toHaveBeenCalled();
  });

  it("코드 발급이 제한되면 세션을 정리하고 안내한다", async () => {
    m.issueChallenge.mockResolvedValue({ ok: false, reason: "cooldown" });
    const result = await runLogin(values);
    expect(messageOf(result)).toBe(CODE_RESEND_LIMITED_MESSAGE);
    expect(m.signOut).toHaveBeenCalledTimes(1);
  });

  it("메일을 보내지 못하면 세션을 정리하고 안내한다", async () => {
    m.sendMail.mockResolvedValue(false);
    const result = await runLogin(values);
    expect(messageOf(result)).toBe(LOGIN_UNAVAILABLE_MESSAGE);
    expect(m.signOut).toHaveBeenCalledTimes(1);
  });
});

describe("runVerifyCode", () => {
  it("차단된 IP는 코드를 검증하지 않는다", async () => {
    m.isIpBlocked.mockResolvedValue(true);
    const result = await runVerifyCode("12345678");
    expect(messageOf(result)).toBe(LOGIN_BLOCKED_MESSAGE);
    expect(m.verifyChallenge).not.toHaveBeenCalled();
  });

  it("세션이 없으면 만료 안내를 준다", async () => {
    m.getClaims.mockResolvedValue({ data: null });
    expect(messageOf(await runVerifyCode("12345678"))).toBe(
      CODE_EXPIRED_MESSAGE,
    );
  });

  it("형식이 틀린 코드는 검증 없이 실패로 센다", async () => {
    const result = await runVerifyCode("abc");
    expect(messageOf(result)).toBe(CODE_MISMATCH_MESSAGE);
    expect(m.verifyChallenge).not.toHaveBeenCalled();
    expect(m.registerLoginFailure).toHaveBeenCalled();
  });

  it("틀린 코드는 IP 연속 실패에 합산한다", async () => {
    m.verifyChallenge.mockResolvedValue("mismatch");
    const result = await runVerifyCode("12345678");
    expect(messageOf(result)).toBe(CODE_MISMATCH_MESSAGE);
    expect(m.registerLoginFailure).toHaveBeenCalled();
    expect(m.addTrustedIp).not.toHaveBeenCalled();
  });

  it("틀린 코드가 5번째 실패면 차단 안내를 준다", async () => {
    m.verifyChallenge.mockResolvedValue("mismatch");
    m.registerLoginFailure.mockResolvedValue({
      blocked: true,
      newlyBlocked: true,
    });
    expect(messageOf(await runVerifyCode("12345678"))).toBe(
      LOGIN_BLOCKED_MESSAGE,
    );
  });

  it("만료·소진·IP 변경은 세션을 정리하고 처음부터 다시 하게 한다", async () => {
    for (const result of ["invalid", "ip_changed"]) {
      m.signOut.mockClear();
      m.verifyChallenge.mockResolvedValue(result);
      expect(messageOf(await runVerifyCode("12345678"))).toBe(
        CODE_EXPIRED_MESSAGE,
      );
      expect(m.signOut).toHaveBeenCalledTimes(1);
    }
  });

  it("맞는 코드는 신뢰 IP 저장·알림·세션 승인 후 로그인을 마친다", async () => {
    m.verifyChallenge.mockResolvedValue("ok");
    const result = await runVerifyCode("12345678", "/profile/edit");
    expect(result).toEqual({
      ok: true,
      data: { status: "done", redirectTo: "/profile/edit" },
    });
    expect(m.addTrustedIp).toHaveBeenCalledWith(fake.admin, "u1", "1.2.3.4");
    expect(m.notifyNewTrustedIp).toHaveBeenCalledWith(
      "admin@example.com",
      "1.2.3.4",
    );
    const approved = fake.calls.find(
      (c) => c.table === "admin_verified_sessions",
    );
    expect(approved?.payload).toMatchObject({ verified_via: "email_code" });
    expect(m.resetLoginFailures).toHaveBeenCalled();
  });
});

describe("runResendCode", () => {
  it("차단된 IP는 재발송하지 않는다", async () => {
    m.isIpBlocked.mockResolvedValue(true);
    expect(messageOf(await runResendCode())).toBe(LOGIN_BLOCKED_MESSAGE);
    expect(m.issueChallenge).not.toHaveBeenCalled();
  });

  it("재발송에 성공하면 ok다", async () => {
    expect(await runResendCode()).toEqual({ ok: true, data: null });
    expect(m.sendMail).toHaveBeenCalledTimes(1);
  });

  it("간격·상한에 걸리면 안내 문구를 준다", async () => {
    m.issueChallenge.mockResolvedValue({ ok: false, reason: "limit" });
    expect(messageOf(await runResendCode())).toBe(CODE_RESEND_LIMITED_MESSAGE);
  });
});
