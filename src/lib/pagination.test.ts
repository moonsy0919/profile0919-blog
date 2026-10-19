import { describe, expect, it } from "vitest";
import { PAGE_SIZE, clampPage } from "@/lib/pagination";

describe("clampPage", () => {
  it("페이지당 개수는 4개다", () => {
    expect(PAGE_SIZE).toBe(4);
  });

  it("범위 안의 페이지는 그대로 돌려준다", () => {
    expect(clampPage(2, 10)).toBe(2);
    expect(clampPage(3, 10)).toBe(3);
  });

  it("undefined는 1페이지로 본다", () => {
    expect(clampPage(undefined, 10)).toBe(1);
  });

  it("0과 음수는 1페이지로 보정한다", () => {
    expect(clampPage(0, 10)).toBe(1);
    expect(clampPage(-3, 10)).toBe(1);
  });

  it("소수와 NaN은 1페이지로 본다", () => {
    expect(clampPage(1.5, 10)).toBe(1);
    expect(clampPage(Number.NaN, 10)).toBe(1);
  });

  it("마지막 페이지를 넘으면 마지막 페이지로 보정한다", () => {
    expect(clampPage(99, 10)).toBe(3);
  });

  it("항목 수가 정확히 페이지 경계일 때 마지막 페이지를 올바로 계산한다", () => {
    expect(clampPage(3, 8)).toBe(2);
    expect(clampPage(2, 8)).toBe(2);
  });

  it("항목이 없으면 항상 1페이지다", () => {
    expect(clampPage(5, 0)).toBe(1);
  });

  it("pageSize를 넘기면 그 크기로 계산한다", () => {
    expect(clampPage(9, 10, 5)).toBe(2);
  });
});
