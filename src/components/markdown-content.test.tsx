import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownContent } from "./markdown-content";

describe("MarkdownContent", () => {
  it("제목과 강조를 마크다운으로 렌더링한다", () => {
    render(<MarkdownContent content={"## 소제목\n\n**굵게**"} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "소제목" }),
    ).toBeTruthy();
    expect(screen.getByText("굵게").tagName).toBe("STRONG");
  });

  it("script 같은 원시 HTML은 요소로 만들지 않고 텍스트로만 보여 준다", () => {
    const { container } = render(
      <MarkdownContent content={"<script>alert(1)</script>\n\n<b>굵게</b>"} />,
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect(container.textContent).toContain("<script>alert(1)</script>");
  });

  it("외부 링크는 새 탭에서 noopener noreferrer로 연다", () => {
    render(<MarkdownContent content="[깃허브](https://github.com/example)" />);
    const link = screen.getByRole("link", { name: "깃허브" });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("내부 링크는 새 탭 속성을 붙이지 않는다", () => {
    render(<MarkdownContent content="[메인](/)" />);
    const link = screen.getByRole("link", { name: "메인" });
    expect(link.getAttribute("target")).toBeNull();
  });

  it("javascript: 링크는 href를 제거한다", () => {
    render(<MarkdownContent content="[위험](javascript:alert(1))" />);
    const link = screen.queryByRole("link", { name: "위험" });
    expect(link?.getAttribute("href") ?? "").not.toContain("javascript:");
  });

  it("GFM 표를 table로 렌더링한다", () => {
    render(
      <MarkdownContent content={"| 이름 | 값 |\n| --- | --- |\n| a | 1 |"} />,
    );
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "이름" })).toBeTruthy();
  });

  it("본문의 # 제목은 h1이 아니라 h2로 그려 페이지의 h1과 겹치지 않는다", () => {
    const { container } = render(<MarkdownContent content="# 큰 제목" />);
    expect(container.querySelector("h1")).toBeNull();
    expect(
      screen.getByRole("heading", { level: 2, name: "큰 제목" }),
    ).toBeTruthy();
  });

  it("react-markdown의 node prop이 DOM 속성으로 새지 않는다", () => {
    const { container } = render(
      <MarkdownContent
        content={"# 제목\n\n본문 [링크](https://a.com)\n\n| a |\n| - |\n| 1 |"}
      />,
    );
    expect(container.querySelector("[node]")).toBeNull();
  });
});
