import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DevLog } from "@/lib/data";
import { DevLogCard } from "./dev-log-card";

const tags = ["react", "next", "supabase", "tailwind", "vitest"].map(
  (name, index) => ({ id: `t${index}`, name }),
);

const baseLog: DevLog = {
  id: "d1",
  title: "개발 일기 제목",
  content: "## 오늘 한 일\n\n**카드**를 만들었다.",
  thumbnailUrl: null,
  githubUrl: "https://github.com/example/blog",
  tags: tags.slice(0, 2),
  createdAt: "2026-10-20T03:00:00.000Z",
  updatedAt: "2026-10-20T03:00:00.000Z",
};

/** 기본 개발 일기에 일부만 덮어써 렌더링한다 */
function renderCard(page?: number, overrides: Partial<DevLog> = {}) {
  return render(
    <DevLogCard devLog={{ ...baseLog, ...overrides }} page={page} />,
  );
}

/** 제목 링크(상세 이동) */
function detailLink() {
  return screen.getByRole("link", { name: "개발 일기 제목" });
}

describe("DevLogCard", () => {
  it("기본 상태에서는 쿼리 없이 상세로 링크한다", () => {
    renderCard();
    expect(detailLink().getAttribute("href")).toBe("/dev-logs/d1");
  });

  it("page만 쿼리로 전달하고 1페이지는 생략한다", () => {
    renderCard(3);
    expect(detailLink().getAttribute("href")).toBe("/dev-logs/d1?page=3");
  });

  it("제목 링크가 카드 전체로 확장된다", () => {
    renderCard();
    expect(detailLink().className).toContain("after:inset-0");
  });

  it("요약과 날짜를 보여준다", () => {
    const { container } = renderCard();
    const summary = screen.getByText(/카드를 만들었다/);
    expect(summary.className).toContain("line-clamp-3");
    expect(container.querySelector("time")?.textContent).toBe("2026. 10. 20.");
  });

  it("태그가 3개 이하면 전부 보여주고 +n은 없다", () => {
    renderCard(undefined, { tags: tags.slice(0, 3) });
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByText(/^\+/)).toBeNull();
  });

  it("태그가 3개를 넘으면 3개만 보여주고 나머지는 +n으로 표시한다", () => {
    renderCard(undefined, { tags });
    expect(screen.getByText("react")).toBeTruthy();
    expect(screen.getByText("supabase")).toBeTruthy();
    expect(screen.queryByText("tailwind")).toBeNull();
    expect(screen.getByText("+2")).toBeTruthy();
  });

  it("태그가 없으면 태그 목록을 그리지 않는다", () => {
    renderCard(undefined, { tags: [] });
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("GitHub 주소가 있으면 새 탭으로 여는 링크를 보여준다", () => {
    renderCard();
    const link = screen.getByRole("link", { name: "GitHub 저장소 열기" });
    expect(link.getAttribute("href")).toBe("https://github.com/example/blog");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.className).toContain("z-10");
  });

  it("GitHub 주소가 없으면 링크를 그리지 않는다", () => {
    renderCard(undefined, { githubUrl: null });
    expect(
      screen.queryByRole("link", { name: "GitHub 저장소 열기" }),
    ).toBeNull();
  });

  it("앵커가 중첩되지 않는다", () => {
    const { container } = renderCard();
    expect(container.querySelectorAll("a a")).toHaveLength(0);
  });

  it("썸네일이 없으면 기본 이미지를 쓴다", () => {
    const { container } = renderCard();
    expect(container.querySelector("img")?.getAttribute("src")).toContain(
      "/default-thumbnail.svg",
    );
  });
});
