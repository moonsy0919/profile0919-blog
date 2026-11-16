import { describe, expect, it } from "vitest";
import {
  buildDetailMetadata,
  isEditMode,
  isEditRequested,
} from "@/lib/edit-mode";

describe("isEditRequested", () => {
  it("edit=1이면 true", () => {
    expect(isEditRequested({ edit: "1" })).toBe(true);
  });

  it("edit가 없거나 1이 아니면 false", () => {
    expect(isEditRequested({})).toBe(false);
    expect(isEditRequested({ edit: "0" })).toBe(false);
    expect(isEditRequested({ edit: "true" })).toBe(false);
    expect(isEditRequested({ edit: "" })).toBe(false);
  });

  it("같은 키가 여러 번이면 첫 값만 본다", () => {
    expect(isEditRequested({ edit: ["1", "0"] })).toBe(true);
    expect(isEditRequested({ edit: ["0", "1"] })).toBe(false);
  });
});

describe("isEditMode", () => {
  it("관리자이고 edit=1이면 수정 모드", () => {
    expect(isEditMode({ edit: "1" }, { isAdmin: true })).toBe(true);
  });

  it("관리자라도 edit가 없으면 읽기 모드", () => {
    expect(isEditMode({}, { isAdmin: true })).toBe(false);
  });

  it("비관리자의 edit=1은 읽기 모드", () => {
    expect(isEditMode({ edit: "1" }, { isAdmin: false })).toBe(false);
  });
});

describe("buildDetailMetadata", () => {
  it("읽기 모드는 제목만 돌려준다", () => {
    expect(buildDetailMetadata("제목", {})).toEqual({ title: "제목" });
  });

  it("edit=1이면 noindex를 붙인다", () => {
    expect(buildDetailMetadata("제목", { edit: "1" })).toEqual({
      title: "제목",
      robots: { index: false, follow: false },
    });
  });
});
