import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useUnsavedChanges } from "./use-unsaved-changes";

describe("useUnsavedChanges", () => {
  afterEach(() => vi.restoreAllMocks());

  it("변경이 없으면 beforeunload를 등록하지 않는다", () => {
    const add = vi.spyOn(window, "addEventListener");
    renderHook(() => useUnsavedChanges(false));
    expect(add).not.toHaveBeenCalledWith("beforeunload", expect.anything());
  });

  it("변경이 있으면 이탈을 막고, 값이 false로 바뀌면 해제한다", () => {
    const { rerender } = renderHook(({ dirty }) => useUnsavedChanges(dirty), {
      initialProps: { dirty: true },
    });
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);

    rerender({ dirty: false });
    const after = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(after);
    expect(after.defaultPrevented).toBe(false);
  });
});
