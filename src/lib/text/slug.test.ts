import { describe, expect, it } from "vitest";
import { suggestSlug } from "@/lib/text/slug";

describe("suggestSlug", () => {
  it("영문 제목을 소문자 하이픈 형태로 바꾼다", () => {
    expect(suggestSlug("Hello, Next.js World!")).toBe("hello-next-js-world");
  });

  it("앞뒤 구분 문자와 연속 하이픈을 정리한다", () => {
    expect(suggestSlug("  --Hello   World--  ")).toBe("hello-world");
  });

  it("한글만 있는 제목은 빈 문자열을 돌려준다", () => {
    expect(suggestSlug("회고 글")).toBe("");
  });

  it("영문과 한글이 섞이면 영문·숫자만 남긴다", () => {
    expect(suggestSlug("React 19 후기")).toBe("react-19");
  });

  it("100자를 넘기면 자르고 끝 하이픈을 지운다", () => {
    const slug = suggestSlug(`${"a".repeat(99)} b`);
    expect(slug.length).toBeLessThanOrEqual(100);
    expect(slug.endsWith("-")).toBe(false);
  });
});
