import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TagCounts } from "@/lib/data";
import { TagSidebar } from "./tag-sidebar";

const tagCounts: TagCounts = {
  total: 11,
  tags: [
    { tag: { id: "t1", name: "react" }, count: 5 },
    { tag: { id: "t2", name: "next js" }, count: 3 },
  ],
};

/** 전체 링크 중 이름이 일치하는 링크를 찾는다 */
function link(name: RegExp) {
  return screen.getByRole("link", { name });
}

describe("TagSidebar", () => {
  it("전체 보기와 태그별 개수를 보여준다", () => {
    render(<TagSidebar tagCounts={tagCounts} />);
    expect(link(/전체 보기/).textContent).toBe("전체 보기11");
    expect(link(/react/).textContent).toBe("react5");
    expect(link(/next js/).textContent).toBe("next js3");
  });

  it("전체 보기는 쿼리 없이 /로 이동한다", () => {
    render(<TagSidebar tagCounts={tagCounts} selectedTag="react" />);
    expect(link(/전체 보기/).getAttribute("href")).toBe("/");
  });

  it("태그 링크는 tag만 담고 page는 담지 않는다", () => {
    render(<TagSidebar tagCounts={tagCounts} />);
    expect(link(/react/).getAttribute("href")).toBe("/?tag=react");
  });

  it("공백이 있는 태그는 인코딩해서 링크한다", () => {
    render(<TagSidebar tagCounts={tagCounts} />);
    expect(link(/next js/).getAttribute("href")).toBe("/?tag=next+js");
  });

  it("태그를 고르지 않으면 전체 보기가 선택된다", () => {
    render(<TagSidebar tagCounts={tagCounts} />);
    expect(link(/전체 보기/).getAttribute("aria-current")).toBe("true");
    expect(link(/react/).getAttribute("aria-current")).toBeNull();
  });

  it("선택한 태그만 aria-current를 가진다", () => {
    render(<TagSidebar tagCounts={tagCounts} selectedTag="react" />);
    expect(link(/react/).getAttribute("aria-current")).toBe("true");
    expect(link(/전체 보기/).getAttribute("aria-current")).toBeNull();
    expect(link(/next js/).getAttribute("aria-current")).toBeNull();
  });

  it("태그가 없으면 전체 보기만 보여준다", () => {
    render(<TagSidebar tagCounts={{ total: 0, tags: [] }} />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(link(/전체 보기/).textContent).toBe("전체 보기0");
  });

  it("모바일은 가로 스크롤 칩, sm 이상은 세로 목록 클래스를 가진다", () => {
    render(<TagSidebar tagCounts={tagCounts} />);
    const list = screen.getByRole("list");
    expect(list.className).toContain("flex-row");
    expect(list.className).toContain("overflow-x-auto");
    expect(list.className).toContain("sm:flex-col");
    expect(link(/react/).className).toContain("rounded-full");
  });
});
