import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Tag } from "@/lib/data";
import { TagPicker } from "./tag-picker";

const { toast, createTag } = vi.hoisted(() => ({
  toast: { info: vi.fn(), error: vi.fn() },
  createTag: vi.fn(),
}));

vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/data/actions", () => ({ createTag }));

const tags: Tag[] = [
  { id: "t1", name: "React" },
  { id: "t2", name: "Next.js" },
  { id: "t3", name: "회고" },
];

/** 선택 상태를 품고 TagPicker를 렌더하는 테스트용 래퍼 */
function Harness({ initial = [] as string[] }) {
  const [ids, setIds] = useState(initial);
  return <TagPicker tags={tags} selectedIds={ids} onChange={setIds} />;
}

/** 검색 입력을 돌려준다 */
function input() {
  return screen.getByRole("combobox") as HTMLInputElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  createTag.mockImplementation(async (name: string) => ({
    ok: true,
    data: { id: `new-${name}`, name },
  }));
});

describe("TagPicker", () => {
  it("입력어로 후보를 대소문자 구분 없이 부분 일치 검색한다", () => {
    render(<Harness />);
    fireEvent.change(input(), { target: { value: "re" } });
    expect(screen.getByRole("option", { name: "React" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "회고" })).toBeNull();
  });

  it("후보를 고르면 칩이 생기고 후보에서는 빠진다", () => {
    render(<Harness />);
    fireEvent.change(input(), { target: { value: "react" } });
    fireEvent.click(screen.getByRole("option", { name: "React" }));
    expect(screen.getByLabelText("React 태그 제거")).toBeTruthy();
    fireEvent.change(input(), { target: { value: "react" } });
    expect(screen.queryByRole("option", { name: "React" })).toBeNull();
  });

  it("↑↓·Enter로 후보를 고르고 Esc로 닫는다", () => {
    render(<Harness />);
    fireEvent.focus(input());
    fireEvent.keyDown(input(), { key: "ArrowDown" });
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(screen.getByLabelText("React 태그 제거")).toBeTruthy();
    fireEvent.change(input(), { target: { value: "n" } });
    fireEvent.keyDown(input(), { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("칩의 ×로 선택을 제거한다", () => {
    render(<Harness initial={["t1"]} />);
    fireEvent.click(screen.getByLabelText("React 태그 제거"));
    expect(screen.queryByLabelText("React 태그 제거")).toBeNull();
  });

  it("[추가]는 입력이 비었거나 같은 이름이 있으면 비활성이다", () => {
    render(<Harness />);
    const add = screen.getByRole("button", {
      name: "추가",
    }) as HTMLButtonElement;
    expect(add.disabled).toBe(true);
    fireEvent.change(input(), { target: { value: "REACT" } });
    expect(add.disabled).toBe(true);
    fireEvent.change(input(), { target: { value: "  #Vitest  " } });
    expect(add.disabled).toBe(false);
  });

  it("[추가]는 정규화한 이름으로 createTag를 호출하고 바로 선택한다", async () => {
    render(<Harness />);
    fireEvent.change(input(), { target: { value: "  #Vitest  " } });
    fireEvent.click(screen.getByRole("button", { name: "추가" }));
    await waitFor(() => expect(createTag).toHaveBeenCalledWith("Vitest"));
    await screen.findByLabelText("Vitest 태그 제거");
  });

  it("11번째 태그는 선택하지 못하고 안내한다", () => {
    const many = Array.from({ length: 11 }, (_, i) => ({
      id: `m${i}`,
      name: `태그${i}`,
    }));
    render(
      <TagPicker
        tags={many}
        selectedIds={many.slice(0, 10).map((tag) => tag.id)}
        onChange={vi.fn()}
      />,
    );
    fireEvent.change(input(), { target: { value: "태그10" } });
    fireEvent.click(screen.getByRole("option", { name: "태그10" }));
    expect(
      screen.getByText("태그는 최대 10개까지 선택할 수 있습니다"),
    ).toBeTruthy();
  });
});
