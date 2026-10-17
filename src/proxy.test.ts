// @vitest-environment node
import { describe, expect, it } from "vitest";
import { config } from "./proxy";

/**
 * proxy 매처가 해당 경로를 세션 갱신 대상으로 삼는지 판단한다.
 * 매처는 `/((?!...).*)` 형태의 단일 패턴이라 전체 일치 정규식으로 근사한다.
 */
function isProxied(pathname: string): boolean {
  const [pattern] = config.matcher;
  return new RegExp(`^${pattern}$`).test(pathname);
}

describe("proxy 매처", () => {
  it("매처가 하나의 패턴으로 구성된다", () => {
    expect(config.matcher).toHaveLength(1);
  });

  it.each([
    "/",
    "/posts",
    "/posts/hello",
    "/login",
    "/dev-logs",
    "/profile/edit",
  ])("%s 는 세션 갱신 대상이다", (pathname) => {
    expect(isProxied(pathname)).toBe(true);
  });

  it("/api/weather 는 폴링되므로 제외한다", () => {
    expect(isProxied("/api/weather")).toBe(false);
  });

  it("/api/weather 와 이름이 비슷한 다른 경로는 제외하지 않는다", () => {
    expect(isProxied("/api/weatherx")).toBe(true);
    expect(isProxied("/api/weather/extra")).toBe(true);
    expect(isProxied("/api/other")).toBe(true);
  });

  it.each([
    "/_next/static/chunks/app.js",
    "/_next/image",
    "/favicon.ico",
    "/icon.svg",
    "/logo.png",
  ])("%s 같은 정적 자원은 제외한다", (pathname) => {
    expect(isProxied(pathname)).toBe(false);
  });
});
