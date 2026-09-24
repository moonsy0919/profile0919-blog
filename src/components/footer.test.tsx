import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "@/components/footer";
import { siteConfig } from "@/config/site";

describe("Footer", () => {
  it("현재 연도의 저작권 문구를 표시한다", () => {
    render(<Footer />);
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(String(year)))).toBeDefined();
  });

  it("githubUrl 설정 여부에 따라 GitHub 링크를 표시한다", () => {
    render(<Footer />);
    const link = screen.queryByRole("link", { name: /GitHub/ });
    expect(link !== null).toBe(siteConfig.githubUrl !== "");
  });
});
