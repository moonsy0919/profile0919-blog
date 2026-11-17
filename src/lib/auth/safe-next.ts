/** 로그인 후 이동할 기본 경로 */
const DEFAULT_NEXT = "/";

/** 제어 문자(탭·줄바꿈 포함)와 역슬래시 — 브라우저가 경로를 다르게 해석할 수 있어 막는다 */
const UNSAFE_PATTERN = /[\\\u0000-\u001f\u007f]/;

/**
 * 로그인 후 이동할 `next` 값을 내부 경로로 제한한다(open redirect 방지).
 * `/`로 시작하는 같은 사이트 경로만 통과시키고, 그 외에는 `/`로 돌린다.
 * 쿼리(edit=1, tag, page 등)는 그대로 보존한다.
 * @param next 쿼리로 받은 next 값
 */
export function sanitizeNext(next: string | string[] | null | undefined) {
  const value = Array.isArray(next) ? next[0] : next;
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_NEXT;
  }
  if (UNSAFE_PATTERN.test(value)) return DEFAULT_NEXT;

  const parsed = new URL(value, "http://internal.invalid");
  if (parsed.origin !== "http://internal.invalid") return DEFAULT_NEXT;
  return `${parsed.pathname}${parsed.search}`;
}
