import { afterEach, describe, expect, it, vi } from "vitest";
import { assertDevOnly } from "./dev-gate";

const notFoundMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

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
