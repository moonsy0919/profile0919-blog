import { SLUG_MAX } from "@/lib/validation/constants";

/**
 * 제목에서 slug 후보를 만든다. 영문 소문자·숫자 덩어리를 하이픈 하나로 잇는다.
 * 영문·숫자가 없는 제목(예: 한글만)은 빈 문자열이라 직접 입력해야 한다.
 * @param title 입력한 제목
 */
export function suggestSlug(title: string): string {
  return title
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}
