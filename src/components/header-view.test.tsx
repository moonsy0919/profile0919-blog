import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HeaderView, type HeaderViewProps } from "./header-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const profile = { displayName: "홍길동", avatarUrl: "/default-avatar.svg" };

/** 기본 props에 일부만 덮어써 렌더링한다 */
function renderHeader(overrides: Partial<HeaderViewProps> = {}) {
  return render(
    <HeaderView
      variant="compact"
      isAdmin={false}
      profile={null}
      devMode={false}
      {...overrides}
    />,
  );
}

describe("HeaderView", () => {
  it("variant를 data 속성으로 표시한다", () => {
    const { container } = renderHeader({ variant: "expanded", profile });
    expect(
      container.querySelector("header")?.getAttribute("data-header-variant"),
    ).toBe("expanded");
  });

  it("확장형에는 프로필과 날씨 자리가 있고 압축형에는 없다", () => {
    const expanded = renderHeader({ variant: "expanded", profile });
    expect(screen.getByTestId("header-profile")).toBeTruthy();
    expect(
      expanded.container.querySelector("[data-header-slot]"),
    ).not.toBeNull();
    expanded.unmount();

    const compact = renderHeader({ variant: "compact" });
    expect(screen.queryByTestId("header-profile")).toBeNull();
    expect(compact.container.querySelector("[data-header-slot]")).toBeNull();
  });

  it("프로덕션 방문자에게는 관리 버튼과 [로그인]이 없다", () => {
    renderHeader();
    for (const name of ["로그인", "작성", "프로필", "로그아웃"]) {
      expect(screen.queryByText(name)).toBeNull();
    }
  });

  it("개발 방문자에게는 [로그인]만 보인다", () => {
    renderHeader({ devMode: true });
    expect(screen.getByRole("link", { name: "로그인" })).toBeTruthy();
    expect(screen.queryByText("작성")).toBeNull();
  });

  it("관리자에게는 [작성][프로필][로그아웃]이 보이고 [로그인]은 없다", () => {
    renderHeader({ isAdmin: true, devMode: true });
    expect(
      screen.getByRole("link", { name: "작성" }).getAttribute("href"),
    ).toBe("/posts/new");
    expect(
      screen.getByRole("link", { name: "프로필" }).getAttribute("href"),
    ).toBe("/profile/edit");
    expect(
      (screen.getByRole("button", { name: "로그아웃" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(screen.queryByText("로그인")).toBeNull();
  });
});
