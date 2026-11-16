import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarkdownEditor } from "./markdown-editor";

describe("MarkdownEditor", () => {
  it("[작성] 탭에서 입력하면 onChange가 호출된다", () => {
    const onChange = vi.fn();
    render(<MarkdownEditor id="c" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("본문"), {
      target: { value: "# 제목" },
    });
    expect(onChange).toHaveBeenCalledWith("# 제목");
  });

  it("[미리보기] 탭은 마크다운을 렌더하고 빈 본문이면 안내한다", async () => {
    const { rerender } = render(
      <MarkdownEditor id="c" value="**굵게**" onChange={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "미리보기" }));
    expect((await screen.findByText("굵게")).tagName).toBe("STRONG");
    rerender(<MarkdownEditor id="c" value="  " onChange={vi.fn()} />);
    expect(screen.getByText("미리볼 내용이 없습니다")).toBeTruthy();
  });

  it("오류 문구를 alert로 보인다", () => {
    render(
      <MarkdownEditor
        id="c"
        value=""
        onChange={vi.fn()}
        error="본문을 입력해 주세요"
      />,
    );
    expect(screen.getByRole("alert").textContent).toBe("본문을 입력해 주세요");
  });
});
