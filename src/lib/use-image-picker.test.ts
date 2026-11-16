import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AVATAR_MAX_BYTES } from "@/lib/validation/constants";
import { useImagePicker } from "./use-image-picker";

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

describe("useImagePicker", () => {
  it("처음에는 변경이 없다", () => {
    const { result } = renderHook(() => useImagePicker());
    expect(result.current.changed).toBe(false);
    expect(result.current.previewUrl).toBeNull();
  });

  it("허용하는 이미지를 고르면 미리보기가 생기고 변경으로 본다", () => {
    const { result } = renderHook(() => useImagePicker());
    act(() =>
      result.current.select(new File(["x"], "a.png", { type: "image/png" })),
    );
    expect(result.current.previewUrl).toBe("blob:preview");
    expect(result.current.changed).toBe(true);
  });

  it("형식·용량 오류는 이전 선택을 유지한 채 오류만 보인다", () => {
    const { result } = renderHook(() => useImagePicker());
    act(() =>
      result.current.select(new File(["x"], "a.png", { type: "image/png" })),
    );
    act(() =>
      result.current.select(
        new File(["x"], "a.svg", { type: "image/svg+xml" }),
      ),
    );
    expect(result.current.error).toContain("형식");
    expect(result.current.previewUrl).toBe("blob:preview");
    const big = new File(["x"], "b.png", { type: "image/png" });
    Object.defineProperty(big, "size", { value: AVATAR_MAX_BYTES + 1 });
    act(() => result.current.select(big));
    expect(result.current.error).toContain("5MB");
  });

  it("제거하면 미리보기 주소를 해제하고 removed가 된다", () => {
    const { result } = renderHook(() => useImagePicker());
    act(() =>
      result.current.select(new File(["x"], "a.png", { type: "image/png" })),
    );
    act(() => result.current.remove());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
    expect(result.current.removed).toBe(true);
    expect(result.current.previewUrl).toBeNull();
  });

  it("언마운트하면 미리보기 주소를 해제한다", () => {
    const { result, unmount } = renderHook(() => useImagePicker());
    act(() =>
      result.current.select(new File(["x"], "a.png", { type: "image/png" })),
    );
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });
});
