import { describe, expect, it } from "vitest";
import { PAGE_SIZE, clampPage, getPageWindow } from "@/lib/pagination";

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

describe("getPageWindow", () => {
  it("페이지가 1개 이하면 [1]이다", () => {
    expect(getPageWindow(1, 1)).toEqual([1]);
    expect(getPageWindow(1, 0)).toEqual([1]);
  });

  it("페이지가 적으면 전부 보여준다", () => {
    expect(getPageWindow(1, 3)).toEqual([1, 2, 3]);
    expect(getPageWindow(2, 5)).toEqual([1, 2, 3, "ellipsis", 5]);
  });

  it("첫 페이지에서는 뒤쪽만 생략한다", () => {
    expect(getPageWindow(1, 10)).toEqual([1, 2, "ellipsis", 10]);
  });

  it("마지막 페이지에서는 앞쪽만 생략한다", () => {
    expect(getPageWindow(10, 10)).toEqual([1, "ellipsis", 9, 10]);
  });

  it("중간 페이지에서는 양쪽을 생략한다", () => {
    expect(getPageWindow(50, 100)).toEqual([
      1,
      "ellipsis",
      49,
      50,
      51,
      "ellipsis",
      100,
    ]);
  });

  it("첫·마지막 페이지와 이어지면 생략 표시를 넣지 않는다", () => {
    expect(getPageWindow(3, 10)).toEqual([1, 2, 3, 4, "ellipsis", 10]);
    expect(getPageWindow(8, 10)).toEqual([1, "ellipsis", 7, 8, 9, 10]);
  });

  it("범위를 벗어난 current는 보정한다", () => {
    expect(getPageWindow(0, 10)).toEqual([1, 2, "ellipsis", 10]);
    expect(getPageWindow(99, 10)).toEqual([1, "ellipsis", 9, 10]);
  });

  it("siblings를 넓히면 더 많이 보여준다", () => {
    expect(getPageWindow(5, 10, 2)).toEqual([
      1,
      "ellipsis",
      3,
      4,
      5,
      6,
      7,
      "ellipsis",
      10,
    ]);
  });
});
