import { beforeEach, describe, expect, it, vi } from "vitest";
import { LOGIN_UNAVAILABLE_MESSAGE } from "./constants";

const m = vi.hoisted(() => ({
  runLogin: vi.fn(),
  runVerifyCode: vi.fn(),
  runResendCode: vi.fn(),
  signOut: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: m.redirect }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { signOut: m.signOut } }),
}));
vi.mock("./login-flow", () => ({
  runLogin: m.runLogin,
  runVerifyCode: m.runVerifyCode,
  runResendCode: m.runResendCode,
  unavailable: () => ({
    ok: false,
    error: { code: "unknown", message: LOGIN_UNAVAILABLE_MESSAGE },
  }),
}));

import {
  cancelLoginCode,
  login,
  logout,
  resendLoginCode,
  verifyLoginCode,
} from "./actions";

const unavailableResult = {
  ok: false,
  error: { code: "unknown", message: LOGIN_UNAVAILABLE_MESSAGE },
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  m.signOut.mockResolvedValue({ error: null });
});

describe("인증 서버 액션", () => {
  it("정상 결과는 그대로 돌려준다", async () => {
    const ok = { ok: true, data: { status: "code_required" } };
    m.runLogin.mockResolvedValue(ok);
    expect(await login({ email: "a@b.c", password: "pw" }, "/x")).toBe(ok);
    expect(m.runLogin).toHaveBeenCalledWith(
      { email: "a@b.c", password: "pw" },
      "/x",
    );
  });

  it("처리 중 오류(서비스 키 누락 등)는 던지지 않고 '지금은 처리할 수 없습니다' 결과로 바꾼다", async () => {
    m.runLogin.mockRejectedValue(new Error("SUPABASE_SERVICE_ROLE_KEY"));
    m.runVerifyCode.mockRejectedValue(new Error("db"));
    m.runResendCode.mockRejectedValue(new Error("db"));
    expect(await login({ email: "a@b.c", password: "pw" })).toEqual(
      unavailableResult,
    );
    expect(await verifyLoginCode("12345678")).toEqual(unavailableResult);
    expect(await resendLoginCode()).toEqual(unavailableResult);
  });

  it("코드 단계 취소는 로그아웃만 하고 이동하지 않는다", async () => {
    await cancelLoginCode();
    expect(m.signOut).toHaveBeenCalledTimes(1);
    expect(m.redirect).not.toHaveBeenCalled();
  });

  it("로그아웃 후 /로 이동한다", async () => {
    await logout();
    expect(m.signOut).toHaveBeenCalledTimes(1);
    expect(m.redirect).toHaveBeenCalledWith("/");
  });
});
