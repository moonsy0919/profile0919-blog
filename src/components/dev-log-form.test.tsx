import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DevLog, Tag } from "@/lib/data";
import { DevLogForm } from "./dev-log-form";

const { push, toast, createDevLog, updateDevLog } = vi.hoisted(() => ({
  push: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
  createDevLog: vi.fn(),
  updateDevLog: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/data/actions", () => ({
  createDevLog,
  updateDevLog,
  createTag: vi.fn(),
}));

const tags: Tag[] = [{ id: "t1", name: "React" }];
const devLog: DevLog = {
  id: "d1",
  title: "일기",
  content: "본문",
  thumbnailUrl: null,
  githubUrl: null,
  tags: [],
  createdAt: "2026-10-20T00:00:00Z",
  updatedAt: "2026-10-20T00:00:00Z",
};

/** 라벨로 입력을 찾아 값을 바꾼다 */
function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

beforeEach(() => {
  vi.clearAllMocks();
  createDevLog.mockResolvedValue({ ok: true, data: { id: "d9" } });
  updateDevLog.mockResolvedValue({ ok: true, data: { id: "d1" } });
});

describe("DevLogForm 게시", () => {
  it("slug 입력이 없고 제목·본문이 비면 [게시]가 비활성이다", () => {
    render(<DevLogForm tags={tags} />);
    expect(screen.queryByLabelText("slug")).toBeNull();
    const button = screen.getByRole("button", {
      name: "게시",
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    type("제목", "일기");
    type("본문", "내용");
    expect(button.disabled).toBe(false);
  });

  it("GitHub URL 형식 오류는 제출 시 필드 오류로 보인다", () => {
    render(<DevLogForm tags={tags} />);
    type("제목", "일기");
    type("본문", "내용");
    type("GitHub URL (선택)", "https://example.com/x");
    fireEvent.click(screen.getByRole("button", { name: "게시" }));
    expect(
      screen.getByText("https://github.com/ 로 시작하는 주소를 입력해 주세요"),
    ).toBeTruthy();
    expect(createDevLog).not.toHaveBeenCalled();
  });

  it("게시 성공 시 토스트 후 상세로 이동한다", async () => {
    render(<DevLogForm tags={tags} />);
    type("제목", "일기");
    type("본문", "내용");
    fireEvent.click(screen.getByRole("button", { name: "게시" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dev-logs/d9"));
    expect(toast.success).toHaveBeenCalledWith("개발 일기가 저장되었습니다");
  });
});

describe("DevLogForm 수정", () => {
  const props = { tags, devLog, cancelHref: "/dev-logs/d1?page=2" };

  it("githubUrl이 null이면 빈 입력이고 변경 없이 [취소]하면 바로 이동한다", () => {
    render(<DevLogForm {...props} />);
    expect(
      (screen.getByLabelText("GitHub URL (선택)") as HTMLInputElement).value,
    ).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(push).toHaveBeenCalledWith("/dev-logs/d1?page=2");
  });

  it("저장 성공 시 읽기 모드로 복귀한다", async () => {
    render(<DevLogForm {...props} />);
    type("제목", "바꿈");
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/dev-logs/d1?page=2"),
    );
    expect(toast.success).toHaveBeenCalledWith("개발 일기가 수정되었습니다");
  });

  it("대상이 이미 삭제됐으면 토스트 후 목록으로 이동한다", async () => {
    updateDevLog.mockResolvedValue({
      ok: false,
      error: { code: "notFound", message: "x" },
    });
    render(<DevLogForm {...props} />);
    type("제목", "바꿈");
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dev-logs"));
    expect(toast.error).toHaveBeenCalledWith("개발 일기를 찾을 수 없습니다");
  });
});
