import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AVATAR_MAX_BYTES } from "@/lib/validation/constants";
import { ProfileForm } from "./profile-form";

const { push, toast, updateProfile } = vi.hoisted(() => ({
  push: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  updateProfile: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/data/actions", () => ({ updateProfile }));

const profile = { id: "p1", displayName: "관리자", avatarUrl: null };

/** 표시 이름 입력을 돌려준다 */
function nameInput() {
  return screen.getByLabelText("표시 이름") as HTMLInputElement;
}

/** 프로필 이미지 input에 파일을 고른다 */
function pickFile(file: File) {
  fireEvent.change(screen.getByLabelText("프로필 이미지"), {
    target: { files: [file] },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

describe("ProfileForm", () => {
  it("현재 프로필 값으로 채워져 열린다", () => {
    render(<ProfileForm initialProfile={profile} />);
    expect(nameInput().value).toBe("관리자");
  });

  it("빈 표시 이름은 필드 오류를 보이고 저장하지 않는다", () => {
    render(<ProfileForm initialProfile={profile} />);
    fireEvent.change(nameInput(), { target: { value: "  " } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(screen.getByText("표시 이름을 입력해 주세요")).toBeTruthy();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("허용하지 않는 형식과 5MB 초과 이미지는 오류를 보인다", () => {
    render(<ProfileForm initialProfile={profile} />);
    pickFile(new File(["x"], "a.svg", { type: "image/svg+xml" }));
    expect(
      screen.getByText("PNG, JPG, GIF, WEBP 형식의 이미지만 올릴 수 있습니다"),
    ).toBeTruthy();
    const big = new File(["x"], "b.png", { type: "image/png" });
    Object.defineProperty(big, "size", { value: AVATAR_MAX_BYTES + 1 });
    pickFile(big);
    expect(screen.getByText("이미지는 5MB 이하로 올려 주세요")).toBeTruthy();
  });

  it("변경이 없으면 [취소]가 바로 메인으로 이동한다", () => {
    render(<ProfileForm initialProfile={profile} />);
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(push).toHaveBeenCalledWith("/");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("변경 후 [취소]는 확인 다이얼로그를 띄우고, 나가기를 누르면 이동한다", async () => {
    render(<ProfileForm initialProfile={profile} />);
    fireEvent.change(nameInput(), { target: { value: "새 이름" } });
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(await screen.findByText("저장하지 않고 나갈까요?")).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "나가기" }));
    expect(push).toHaveBeenCalledWith("/");
  });

  it("저장 성공 시 토스트를 띄우고 메인으로 이동한다", async () => {
    updateProfile.mockResolvedValue({ ok: true, data: profile });
    render(<ProfileForm initialProfile={profile} />);
    fireEvent.change(nameInput(), { target: { value: " 새 이름 " } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(updateProfile).toHaveBeenCalledWith({
      displayName: "새 이름",
      avatarUrl: null,
    });
    expect(toast.success).toHaveBeenCalledWith("프로필이 저장되었습니다");
  });

  it("저장 실패는 필드 오류 또는 토스트로 알리고 이동하지 않는다", async () => {
    updateProfile.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "validation",
        message: "검증 실패",
        fieldErrors: { displayName: "서버가 거부한 이름" },
      },
    });
    render(<ProfileForm initialProfile={profile} />);
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(await screen.findByText("서버가 거부한 이름")).toBeTruthy();

    updateProfile.mockResolvedValueOnce({
      ok: false,
      error: { code: "unknown", message: "오류" },
    });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(push).not.toHaveBeenCalled();
  });
});
