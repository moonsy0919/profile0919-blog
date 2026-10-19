/** 카드 요약의 기본 최대 글자 수. 줄 수 제한(3줄 말줄임)은 CSS line-clamp가 맡는다 */
export const EXCERPT_MAX_LENGTH = 160;

/** 말줄임 부호 */
const ELLIPSIS = "…";

/**
 * 마크다운에서 본문이 아닌 블록(코드블록·이미지·HTML 태그·가로줄)을 통째로 지운다.
 * 닫히지 않은 코드블록은 끝까지 지운다.
 * @param text 마크다운 원문
 */
function removeBlocks(text: string): string {
  return text
    .replace(/(`{3,}|~{3,})[\s\S]*?(?:\1|$)/g, " ")
    .replace(/!\[[^\]\n]*\]\([^)\n]*\)/g, " ")
    .replace(/<[^>\n]+>/g, " ")
    .replace(/^[ \t]*([-*_])(?:[ \t]*\1){2,}[ \t]*$/gm, " ");
}

/**
 * 줄 맨 앞의 헤딩·인용·목록 기호를 지운다.
 * @param text 마크다운 원문
 */
function removeLineMarkers(text: string): string {
  return text.replace(
    /^[ \t]{0,3}(?:#{1,6}[ \t]+|(?:>[ \t]?)+|[-*+][ \t]+|\d{1,9}[.)][ \t]+)/gm,
    "",
  );
}

/**
 * 링크는 글자만 남기고, 인라인코드·강조 기호를 벗긴다.
 * 밑줄 강조는 snake_case 같은 단어 안의 밑줄을 건드리지 않도록 경계에서만 벗긴다.
 * @param text 마크다운 원문
 */
function removeInlineMarkers(text: string): string {
  return text
    .replace(/\[([^\]\n]*)\]\([^)\n]*\)/g, "$1")
    .replace(/`([^`\n]*)`/g, "$1")
    .replace(/\*+|~~/g, "")
    .replace(/(^|[^\w])_{1,3}([^_\n]+)_{1,3}(?![\w])/g, "$1$2");
}

/**
 * 마크다운 본문에서 카드에 쓸 짧은 요약을 뽑는다.
 * 마크다운 기호를 지우고 공백을 한 칸으로 정리한 뒤, maxLength를 넘으면
 * 앞 maxLength자만 남기고 말줄임 부호를 붙인다.
 * @param markdown 마크다운 본문
 * @param maxLength 최대 글자 수 (말줄임 부호 제외)
 */
export function extractExcerpt(
  markdown: string,
  maxLength: number = EXCERPT_MAX_LENGTH,
): string {
  const plain = removeInlineMarkers(removeLineMarkers(removeBlocks(markdown)))
    .replace(/\s+/g, " ")
    .trim();
  const chars = Array.from(plain);
  if (maxLength <= 0) return "";
  if (chars.length <= maxLength) return plain;
  return chars.slice(0, maxLength).join("").trimEnd() + ELLIPSIS;
}
