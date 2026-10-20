import { describe, expect, it } from "vitest";
import { formatPostDate } from "@/lib/format-date";

describe("formatPostDate", () => {
  it("서울 기준 ko-KR 형식으로 바꾼다", () => {
    expect(formatPostDate("2026-10-20T03:00:00.000Z")).toBe("2026. 10. 20.");
  });

  it("UTC 자정 직전도 서울 날짜로 바꾼다", () => {
    expect(formatPostDate("2026-10-19T16:00:00.000Z")).toBe("2026. 10. 20.");
  });
});
