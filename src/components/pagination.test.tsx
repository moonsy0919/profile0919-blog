import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Pagination } from "./pagination";

/** 이름이 정확히 일치하는 링크를 찾는다 */
function link(name: string) {
  return screen.getByRole("link", { name });
}

describe("Pagination", () => {
  it("페이지가 1개 이하면 아무것도 그리지 않는다", () => {
    const { container } = render(<Pagination page={1} totalPages={1} />);
    expect(container.firstChild).toBeNull();
  });

  it("번호 링크를 보여주고 현재 페이지에 aria-current를 붙인다", () => {
    render(<Pagination page={2} totalPages={3} />);
    expect(link("2").getAttribute("aria-current")).toBe("page");
    expect(link("1").getAttribute("aria-current")).toBeNull();
    expect(link("3").getAttribute("aria-current")).toBeNull();
  });

  it("1페이지 링크는 page 쿼리를 생략한다", () => {
    render(<Pagination page={2} totalPages={3} />);
    expect(link("1").getAttribute("href")).toBe("/");
    expect(link("3").getAttribute("href")).toBe("/?page=3");
  });

  it("선택한 태그를 모든 링크에 유지한다", () => {
    render(<Pagination page={2} totalPages={3} tag="react" />);
    expect(link("1").getAttribute("href")).toBe("/?tag=react");
    expect(link("3").getAttribute("href")).toBe("/?tag=react&page=3");
    expect(link("다음").getAttribute("href")).toBe("/?tag=react&page=3");
  });

  it("중간 페이지에서는 이전과 다음이 이웃 페이지로 연결된다", () => {
    render(<Pagination page={2} totalPages={3} />);
    expect(link("이전").getAttribute("href")).toBe("/");
    expect(link("다음").getAttribute("href")).toBe("/?page=3");
  });

  it("첫 페이지에서는 이전이 링크가 아니라 비활성이다", () => {
    render(<Pagination page={1} totalPages={3} />);
    expect(screen.queryByRole("link", { name: "이전" })).toBeNull();
    expect(screen.getByText("이전").getAttribute("aria-disabled")).toBe("true");
    expect(link("다음")).toBeTruthy();
  });

  it("마지막 페이지에서는 다음이 링크가 아니라 비활성이다", () => {
    render(<Pagination page={3} totalPages={3} />);
    expect(screen.queryByRole("link", { name: "다음" })).toBeNull();
    expect(screen.getByText("다음").getAttribute("aria-disabled")).toBe("true");
    expect(link("이전")).toBeTruthy();
  });

  it("페이지가 많으면 현재 주변만 번호로 보여주고 나머지는 …으로 줄인다", () => {
    render(<Pagination page={50} totalPages={100} />);
    const labels = screen
      .getAllByRole("link")
      .map((anchor) => anchor.textContent);
    expect(labels).toEqual(["이전", "1", "49", "50", "51", "100", "다음"]);
    expect(screen.getAllByText("…")).toHaveLength(2);
  });

  it("nav에 접근 가능한 이름이 있다", () => {
    render(<Pagination page={1} totalPages={2} />);
    expect(
      screen.getByRole("navigation", { name: "페이지 이동" }),
    ).toBeTruthy();
  });
});
