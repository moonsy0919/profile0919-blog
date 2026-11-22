import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThumbnailField } from "./thumbnail-field";

/** 기본 props에 덮어쓸 값을 얹어 그린다 */
function setup(props: Partial<Parameters<typeof ThumbnailField>[0]> = {}) {
  return render(
    <ThumbnailField
      src={null}
      error={null}
      onSelect={vi.fn()}
      onRemove={vi.fn()}
      {...props}
    />,
  );
}

describe("ThumbnailField 업로드 표시", () => {
  it("업로드 중이 아니면 상태 문구가 없다", () => {
    setup();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("업로드 중이면 안내 문구를 보인다", () => {
    setup({ uploading: true });
    expect(screen.getByRole("status").textContent).toContain("올리는 중");
  });

  it("업로드 실패 문구를 alert로 보이고 입력에 오류를 연결한다", () => {
    setup({ error: "이미지를 올리지 못했습니다. 다시 시도해 주세요" });
    expect(screen.getByRole("alert").textContent).toContain(
      "올리지 못했습니다",
    );
    expect(screen.getByLabelText("썸네일").getAttribute("aria-invalid")).toBe(
      "true",
    );
  });

  it("disabled면 파일 선택과 제거 버튼이 막힌다", () => {
    setup({ src: "/dummy/a.png", disabled: true });
    expect(screen.getByLabelText("썸네일").hasAttribute("disabled")).toBe(true);
    expect(
      screen
        .getByRole("button", { name: "이미지 제거" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });
});
