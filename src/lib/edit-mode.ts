import type { Metadata } from "next";
import type { RawSearchParams } from "@/lib/list-state";

/**
 * URL에 edit=1이 있는지 본다. 같은 키가 여러 번이면 첫 값만 쓰고, 1이 아닌 값은 무시한다.
 * @param searchParams 상세 페이지가 받은 searchParams
 */
export function isEditRequested(searchParams: RawSearchParams): boolean {
  const value = searchParams.edit;
  return (Array.isArray(value) ? value[0] : value) === "1";
}

/**
 * 수정 모드로 그릴지 판정한다. edit=1이고 관리자일 때만 true다.
 * 페이지는 edit=1이면 먼저 requireAdmin으로 비관리자를 로그인으로 보내므로,
 * 여기서 false가 되는 비관리자는 방어적으로 읽기 모드가 된다.
 * @param searchParams 상세 페이지가 받은 searchParams
 * @param viewer 현재 방문자 정보
 */
export function isEditMode(
  searchParams: RawSearchParams,
  viewer: { isAdmin: boolean },
): boolean {
  return viewer.isAdmin && isEditRequested(searchParams);
}

/**
 * 상세 페이지의 메타데이터를 만든다. edit=1이 붙은 주소는 중복 주소이자
 * 관리 화면이므로 색인하지 않도록 noindex로 표시한다.
 * @param title 문서 제목 (루트 레이아웃의 템플릿이 사이트 이름을 덧붙인다)
 * @param searchParams 상세 페이지가 받은 searchParams
 */
export function buildDetailMetadata(
  title: string,
  searchParams: RawSearchParams,
): Metadata {
  if (!isEditRequested(searchParams)) return { title };
  return { title, robots: { index: false, follow: false } };
}
