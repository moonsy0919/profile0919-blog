import { describe, expect, it } from "vitest";
import {
  buildBlockedMail,
  buildCodeMail,
  buildNewTrustedIpMail,
} from "./auth-mails";

describe("메일 본문", () => {
  it("인증 코드 메일에 코드·IP·유효 시간이 들어간다", () => {
    const mail = buildCodeMail("a@b.c", "12345678", "1.2.3.4");
    expect(mail.to).toBe("a@b.c");
    expect(mail.text).toContain("12345678");
    expect(mail.text).toContain("1.2.3.4");
    expect(mail.text).toContain("10분");
  });

  it("신뢰 IP 알림에는 코드가 없고 해제 방법이 있다", () => {
    const mail = buildNewTrustedIpMail("a@b.c", "1.2.3.4", new Date());
    expect(mail.text).toContain("admin_trusted_ips");
    expect(mail.text).not.toMatch(/\d{8}/);
  });

  it("차단 알림에 IP와 해제 방법(대시보드에서 행 삭제)이 있다", () => {
    const mail = buildBlockedMail("a@b.c", "1.2.3.4", new Date());
    expect(mail.text).toContain("1.2.3.4");
    expect(mail.text).toContain("admin_ip_attempts");
  });
});
