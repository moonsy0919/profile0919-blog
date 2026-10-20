import { afterEach, describe, expect, it, vi } from "vitest";
import { assertDevOnly, isDevOnlyOpen } from "./dev-gate";

const notFoundMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

describe("isDevOnlyOpen", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("프로덕션에서만 false다", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isDevOnlyOpen()).toBe(false);
    vi.stubEnv("NODE_ENV", "development");
    expect(isDevOnlyOpen()).toBe(true);
    vi.stubEnv("NODE_ENV", "test");
    expect(isDevOnlyOpen()).toBe(true);
  });
});

describe("assertDevOnly", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    notFoundMock.mockReset();
  });

  it("프로덕션에서는 notFound()를 호출한다", () => {
    vi.stubEnv("NODE_ENV", "production");
    assertDevOnly();
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("개발 환경에서는 통과한다", () => {
    vi.stubEnv("NODE_ENV", "development");
    assertDevOnly();
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("테스트 환경에서도 통과한다", () => {
    vi.stubEnv("NODE_ENV", "test");
    assertDevOnly();
    expect(notFoundMock).not.toHaveBeenCalled();
  });
});
