import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteButton } from "./delete-button";

const { push, toast, deletePost, deleteDevLog } = vi.hoisted(() => ({
  push: vi.fn(),
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
  deletePost: vi.fn(),
  deleteDevLog: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/data/actions", () => ({ deletePost, deleteDevLog }));

/** 삭제 버튼을 누르고 열린 다이얼로그를 돌려준다 */
function openDialog() {
  fireEvent.click(screen.getByRole("button", { name: "삭제" }));
  return screen.getByRole("dialog");
}

/** 다이얼로그 안의 확인 [삭제] 버튼을 누른다 */
function confirmDelete(dialog: HTMLElement) {
  fireEvent.click(within(dialog).getByRole("button", { name: /삭제/ }));
}

describe("DeleteButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deletePost.mockResolvedValue({ ok: true, data: null });
    deleteDevLog.mockResolvedValue({ ok: true, data: null });
  });

  it("게시글은 글 삭제 문구를 보여 준다", () => {
    render(<DeleteButton kind="post" id="p1" />);
    const dialog = openDialog();
    expect(within(dialog).getByText("글을 삭제할까요?")).toBeTruthy();
    expect(
      within(dialog).getByText("삭제한 글은 되돌릴 수 없습니다."),
    ).toBeTruthy();
  });

  it("개발 일기는 개발 일기 삭제 문구를 보여 준다", () => {
    render(<DeleteButton kind="devLog" id="d1" />);
    const dialog = openDialog();
    expect(within(dialog).getByText("개발 일기를 삭제할까요?")).toBeTruthy();
    expect(
      within(dialog).getByText("삭제한 개발 일기는 되돌릴 수 없습니다."),
    ).toBeTruthy();
  });

  it("[취소]를 누르면 삭제하지 않고 닫는다", async () => {
    render(<DeleteButton kind="post" id="p1" />);
    const dialog = openDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "취소" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(deletePost).not.toHaveBeenCalled();
  });

  it("Esc를 누르면 삭제하지 않고 닫는다", async () => {
    render(<DeleteButton kind="post" id="p1" />);
    openDialog();
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(deletePost).not.toHaveBeenCalled();
  });

  it("삭제 성공 시 토스트를 띄우고 게시글은 메인으로 이동한다", async () => {
    render(<DeleteButton kind="post" id="p1" />);
    confirmDelete(openDialog());
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(deletePost).toHaveBeenCalledWith("p1");
    expect(toast.success).toHaveBeenCalledWith("글이 삭제되었습니다");
  });

  it("개발 일기 삭제 성공 시 /dev-logs로 이동한다", async () => {
    render(<DeleteButton kind="devLog" id="d1" />);
    confirmDelete(openDialog());
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dev-logs"));
    expect(deleteDevLog).toHaveBeenCalledWith("d1");
    expect(toast.success).toHaveBeenCalledWith("개발 일기가 삭제되었습니다");
  });

  it("이미 삭제된 대상이면 안내 토스트 후 이동한다", async () => {
    deletePost.mockResolvedValue({
      ok: false,
      error: { code: "notFound", message: "이미 삭제된 글입니다." },
    });
    render(<DeleteButton kind="post" id="p1" />);
    confirmDelete(openDialog());
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(toast.info).toHaveBeenCalledWith("이미 삭제된 글입니다.");
  });

  it("실패하면 오류 토스트를 띄우고 이동 없이 다이얼로그를 닫는다", async () => {
    deletePost.mockResolvedValue({
      ok: false,
      error: { code: "unknown", message: "내부 오류" },
    });
    render(<DeleteButton kind="post" id="p1" />);
    confirmDelete(openDialog());
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "삭제하지 못했습니다. 다시 시도해 주세요",
      ),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(push).not.toHaveBeenCalled();
  });

  it("진행 중에는 두 버튼이 비활성화되고 완료를 알린다", async () => {
    let finish: (value: unknown) => void = () => {};
    deletePost.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const onPendingChange = vi.fn();
    render(
      <DeleteButton kind="post" id="p1" onPendingChange={onPendingChange} />,
    );
    const dialog = openDialog();
    confirmDelete(dialog);

    await waitFor(() => {
      const buttons = within(dialog).getAllByRole("button");
      expect(buttons.every((button) => button.hasAttribute("disabled"))).toBe(
        true,
      );
    });
    expect(onPendingChange).toHaveBeenLastCalledWith(true);

    await act(async () => finish({ ok: true, data: null }));
    await waitFor(() =>
      expect(onPendingChange).toHaveBeenLastCalledWith(false),
    );
  });
});
