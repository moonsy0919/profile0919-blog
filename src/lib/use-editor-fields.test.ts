import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEditorFields } from "./use-editor-fields";

const INITIAL = { title: "", content: "", thumbnailUrl: null, tagIds: [] };
const png = new File(["x"], "a.png", { type: "image/png" });

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

describe("useEditorFields 업로드 상태", () => {
  it("제목·본문이 비어 있으면 [저장]이 막힌다", () => {
    const { result } = renderHook(() => useEditorFields(INITIAL));
    expect(result.current.submitBlocked).toBe(true);
  });

  it("제목·본문이 채워지면 풀리고, 업로드 중이면 다시 막힌다", () => {
    const { result } = renderHook(() => useEditorFields(INITIAL));
    act(() => {
      result.current.setTitle("제목");
      result.current.setContent("본문");
    });
    expect(result.current.submitBlocked).toBe(false);

    act(() => result.current.setUploading(true));
    expect(result.current.submitBlocked).toBe(true);

    act(() => result.current.setUploading(false));
    expect(result.current.submitBlocked).toBe(false);
  });

  it("새 파일을 고르면 이전 업로드 실패 문구를 지우고 File을 보관한다", () => {
    const { result } = renderHook(() => useEditorFields(INITIAL));
    act(() => result.current.setUploadError("올리지 못했습니다"));
    act(() => result.current.selectThumbnail(png));
    expect(result.current.uploadError).toBeNull();
    expect(result.current.thumbnail.file).toBe(png);
  });

  it("썸네일을 제거해도 업로드 실패 문구를 지운다", () => {
    const { result } = renderHook(() => useEditorFields(INITIAL));
    act(() => result.current.setUploadError("올리지 못했습니다"));
    act(() => result.current.removeThumbnail());
    expect(result.current.uploadError).toBeNull();
    expect(result.current.savedThumbnailUrl).toBeNull();
  });
});
