/*
 * 입력 검증 상수. PRD 2.5의 DB check 제약·4.4 폼 공통 검증과 같은 수치를 쓴다.
 * 클라이언트 폼과 서버 액션이 같은 값을 보도록 한 곳에서만 정의한다.
 */

/** 제목 최대 길이 (앞뒤 공백 제거 후 1~100자) */
export const TITLE_MAX = 100;

/** 태그 이름 최대 길이 (정규화 후 1~20자) */
export const TAG_NAME_MAX = 20;

/** 글(게시글·개발 일기) 하나에 붙일 수 있는 태그 최대 개수 */
export const TAGS_PER_POST_MAX = 10;

/** 프로필 표시 이름 최대 길이 (1~30자) */
export const DISPLAY_NAME_MAX = 30;

/** slug 최대 길이. PRD에 수치가 없어 URL에 쓰기 무난한 값으로 정했다 (DB check에는 없다) */
export const SLUG_MAX = 100;

/** 썸네일·GitHub URL 최대 길이 */
export const URL_MAX = 2048;

/** slug로 쓸 수 없는 예약어. /posts/new 라우트와 충돌하기 때문이다 */
export const RESERVED_SLUGS: readonly string[] = ["new"];
