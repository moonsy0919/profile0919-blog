import { describe, expect, it } from "vitest";
import { extractExcerpt } from "@/lib/text/excerpt";

describe("extractExcerpt", () => {
  it("빈 문자열과 공백만 있는 본문은 빈 문자열이다", () => {
    expect(extractExcerpt("")).toBe("");
    expect(extractExcerpt("  \n\t \n")).toBe("");
  });

  it("기호만 있는 본문은 빈 문자열이다", () => {
    expect(extractExcerpt("# \n> \n- \n---\n***")).toBe("");
  });

  it("헤딩·인용·목록 기호를 지운다", () => {
    const md = "# 제목\n> 인용\n- 항목\n* 항목2\n1. 첫째\n2) 둘째";
    expect(extractExcerpt(md)).toBe("제목 인용 항목 항목2 첫째 둘째");
  });

  it("중첩 인용 기호도 지운다", () => {
    expect(extractExcerpt("> > 깊은 인용")).toBe("깊은 인용");
  });

  it("강조와 취소선 기호를 지운다", () => {
    expect(extractExcerpt("**굵게 *기울임*** ~~취소~~")).toBe(
      "굵게 기울임 취소",
    );
  });

  it("밑줄 강조는 벗기되 단어 안의 밑줄은 남긴다", () => {
    expect(extractExcerpt("_기울임_ 그리고 snake_case_name")).toBe(
      "기울임 그리고 snake_case_name",
    );
  });

  it("인라인코드는 기호만 지우고 내용은 남긴다", () => {
    expect(extractExcerpt("`@theme` 블록을 쓴다")).toBe("@theme 블록을 쓴다");
  });

  it("링크는 글자만 남기고 이미지는 통째로 지운다", () => {
    const md = "![스크린샷](/a.png) [문서](https://example.com) 참고";
    expect(extractExcerpt(md)).toBe("문서 참고");
  });

  it("코드블록은 내용까지 통째로 지운다", () => {
    const md = "앞\n```ts\nconst a = 1;\n```\n뒤";
    expect(extractExcerpt(md)).toBe("앞 뒤");
  });

  it("닫히지 않은 코드블록은 끝까지 지운다", () => {
    expect(extractExcerpt("앞\n```\nconst a = 1;\n뒤")).toBe("앞");
  });

  it("HTML 태그를 지운다", () => {
    expect(extractExcerpt("<b>굵게</b> 텍스트")).toBe("굵게 텍스트");
  });

  it("연속 공백과 줄바꿈을 한 칸으로 정리한다", () => {
    expect(extractExcerpt("가\n\n\n나\t\t다   라")).toBe("가 나 다 라");
  });

  it("정확히 maxLength이면 말줄임 없이 그대로 돌려준다", () => {
    expect(extractExcerpt("가나다라마", 5)).toBe("가나다라마");
  });

  it("maxLength를 넘으면 자르고 말줄임 부호를 붙인다", () => {
    expect(extractExcerpt("가나다라마바", 5)).toBe("가나다라마…");
  });

  it("자른 끝의 공백은 말줄임 앞에 남기지 않는다", () => {
    expect(extractExcerpt("가나다 라마바", 4)).toBe("가나다…");
  });

  it("이모지 같은 서로게이트 쌍을 반으로 자르지 않는다", () => {
    expect(extractExcerpt("😀😀😀", 2)).toBe("😀😀…");
  });

  it("maxLength가 0 이하이면 빈 문자열이다", () => {
    expect(extractExcerpt("본문", 0)).toBe("");
    expect(extractExcerpt("본문", -1)).toBe("");
  });

  it("더미 게시글 본문에서 기호가 남지 않는다", () => {
    expect(
      extractExcerpt("# 시작\n\n개인 블로그를 만들며 **기록**을 시작합니다."),
    ).toBe("시작 개인 블로그를 만들며 기록을 시작합니다.");
  });
});
