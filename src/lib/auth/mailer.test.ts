import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendMail } from "./mailer";

const message = {
  to: "admin@example.com",
  subject: "제목",
  text: "본문 12345678",
};

beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("sendMail", () => {
  it("키가 있으면 Resend API로 보낸다", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendMail(message)).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test");
    expect(JSON.parse(init.body)).toMatchObject({
      to: ["admin@example.com"],
      subject: "제목",
    });
  });

  it("Resend가 실패 응답이면 false다", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 422 }),
    );
    expect(await sendMail(message)).toBe(false);
  });

  it("네트워크 오류가 나도 던지지 않고 false다", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    expect(await sendMail(message)).toBe(false);
  });

  it("개발에서 키가 없으면 콘솔에 출력하고 true다", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    expect(await sendMail(message)).toBe(true);
    expect(info).toHaveBeenCalled();
  });

  it("운영에서 키가 없으면 보내지 않고 본문을 로그에 남기지 않는다", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    const info = vi.spyOn(console, "info");
    expect(await sendMail(message)).toBe(false);
    expect(info).not.toHaveBeenCalled();
  });
});
