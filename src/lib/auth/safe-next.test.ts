import { describe, expect, it } from "vitest";
import { sanitizeNext } from "./safe-next";

describe("sanitizeNext", () => {
  it("내부 경로와 쿼리를 그대로 통과시킨다", () => {
    expect(sanitizeNext("/profile/edit")).toBe("/profile/edit");
    expect(sanitizeNext("/posts/hello?edit=1&tag=dev&page=2")).toBe(
      "/posts/hello?edit=1&tag=dev&page=2",
    );
  });

  it("비었거나 없으면 /로 돌린다", () => {
    expect(sanitizeNext(undefined)).toBe("/");
    expect(sanitizeNext(null)).toBe("/");
    expect(sanitizeNext("")).toBe("/");
  });

  it("외부 주소와 프로토콜 상대 주소는 /로 돌린다", () => {
    expect(sanitizeNext("https://evil.com")).toBe("/");
    expect(sanitizeNext("//evil.com")).toBe("/");
    expect(sanitizeNext("javascript:alert(1)")).toBe("/");
    expect(sanitizeNext("evil.com")).toBe("/");
  });

  it("역슬래시와 제어 문자가 섞인 값은 /로 돌린다", () => {
    expect(sanitizeNext("/\\evil.com")).toBe("/");
    expect(sanitizeNext("/\t/evil.com")).toBe("/");
    expect(sanitizeNext("/a\nb")).toBe("/");
  });

  it("배열로 들어오면 첫 값만 쓴다", () => {
    expect(sanitizeNext(["/a", "https://evil.com"])).toBe("/a");
  });
});
