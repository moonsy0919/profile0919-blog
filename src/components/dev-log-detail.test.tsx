import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DevLog } from "@/lib/data";
import { DevLogDetail } from "./dev-log-detail";

vi.mock("@/components/admin-actions", () => ({
  AdminActions: ({ kind, id, editHref }: Record<string, string>) => (
    <div data-testid="admin-actions" data-kind={kind} data-id={id}>
      <a href={editHref}>수정</a>
      <button type="button">삭제</button>
    </div>
  ),
}));

const baseLog: DevLog = {
  id: "d1",
  title: "개발 일기 제목",
  content: "## 오늘 한 일\n\n**상세**를 만들었다.",
  thumbnailUrl: null,
  githubUrl: "https://github.com/example/blog",
  tags: [
    { id: "t1", name: "react" },
    { id: "t2", name: "next" },
  ],
  createdAt: "2026-10-20T03:00:00.000Z",
  updatedAt: "2026-10-20T03:00:00.000Z",
};

/** 기본 개발 일기에 일부만 덮어써 렌더링한다 */
function renderDetail(
  overrides: Partial<DevLog> = {},
  props: { isAdmin?: boolean; backHref?: string } = {},
) {
  return render(
    <DevLogDetail
      devLog={{ ...baseLog, ...overrides }}
      backHref={props.backHref ?? "/dev-logs"}
      isAdmin={props.isAdmin ?? false}
      editHref="/dev-logs/d1?edit=1"
    />,
  );
}

describe("DevLogDetail", () => {
  it("제목을 h1로, 본문을 마크다운으로 렌더링한다", () => {
    renderDetail();
    expect(
      screen.getByRole("heading", { level: 1, name: "개발 일기 제목" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 2, name: "오늘 한 일" }),
    ).toBeTruthy();
  });

  it("[목록으로]는 전달받은 주소로 연결된다", () => {
    renderDetail({}, { backHref: "/dev-logs?page=2" });
    expect(
      screen.getByRole("link", { name: "목록으로" }).getAttribute("href"),
    ).toBe("/dev-logs?page=2");
  });

  it("썸네일이 없으면 이미지를 그리지 않는다", () => {
    const { container } = renderDetail({ thumbnailUrl: null });
    expect(container.querySelector("img")).toBeNull();
  });

  it("썸네일이 있으면 이미지를 그린다", () => {
    const { container } = renderDetail({ thumbnailUrl: "/dummy/log.png" });
    expect(container.querySelector("img")).not.toBeNull();
  });

  it("태그 칩은 링크 없이 표시만 한다", () => {
    renderDetail();
    expect(screen.getByText("react")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "react" })).toBeNull();
  });

  it("GitHub 링크는 새 탭으로 열린다", () => {
    renderDetail();
    const link = screen.getByRole("link", { name: "GitHub 저장소 열기" });
    expect(link.getAttribute("href")).toBe("https://github.com/example/blog");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("GitHub 주소가 없으면 링크를 그리지 않는다", () => {
    renderDetail({ githubUrl: null });
    expect(
      screen.queryByRole("link", { name: "GitHub 저장소 열기" }),
    ).toBeNull();
  });

  it("방문자 DOM에는 [수정]/[삭제]가 없다", () => {
    renderDetail({}, { isAdmin: false });
    expect(screen.queryByTestId("admin-actions")).toBeNull();
    expect(screen.queryByRole("button", { name: "삭제" })).toBeNull();
  });

  it("관리자에게는 개발 일기 id로 [수정]/[삭제]를 그린다", () => {
    renderDetail({}, { isAdmin: true });
    const actions = screen.getByTestId("admin-actions");
    expect(actions.getAttribute("data-kind")).toBe("devLog");
    expect(actions.getAttribute("data-id")).toBe("d1");
    expect(
      screen.getByRole("link", { name: "수정" }).getAttribute("href"),
    ).toBe("/dev-logs/d1?edit=1");
  });
});
