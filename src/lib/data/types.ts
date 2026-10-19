/**
 * 데이터 접근 계층의 도메인 타입.
 * database.types.ts가 아직 posts만 담고 있어 PRD 2.3 ERD 기준으로 수기 정의한다.
 * 실데이터 연동(Task 014 이후)에서도 이 타입을 바꾸지 않고 구현만 교체한다.
 */

/** 블로그와 개발 일기가 공유하는 태그 */
export type Tag = {
  id: string;
  name: string;
};

/** 게시글 */
export type Post = {
  id: string;
  slug: string;
  title: string;
  content: string;
  thumbnailUrl: string | null;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
};

/** 개발 일기 (slug 없이 id로 조회) */
export type DevLog = {
  id: string;
  title: string;
  content: string;
  thumbnailUrl: string | null;
  githubUrl: string | null;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
};

/** 관리자 프로필 (헤더 중앙 표시) */
export type Profile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

/** 현재 보는 사람. 방문자는 isAdmin이 false */
export type Viewer = {
  isAdmin: boolean;
};

/** 페이지 단위 목록 조회 결과 */
export type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** 게시글 목록 조회 조건 */
export type GetPostsParams = {
  tag?: string;
  page?: number;
};

/** 개발 일기 목록 조회 조건 */
export type GetDevLogsParams = {
  page?: number;
};

/** 사이드바 태그별 글 개수 */
export type TagCount = {
  tag: Tag;
  count: number;
};

/** 사이드바 태그 개수 조회 결과. total은 "전체 보기" 개수 */
export type TagCounts = {
  total: number;
  tags: TagCount[];
};

/** 게시글 작성 입력. 이미지는 파일이 아니라 업로드된 URL만 받는다 */
export type PostInput = {
  title: string;
  slug: string;
  content: string;
  thumbnailUrl: string | null;
  tagIds: string[];
};

/** 게시글 수정 입력 */
export type UpdatePostInput = PostInput & { id: string };

/** 개발 일기 작성 입력 */
export type DevLogInput = {
  title: string;
  content: string;
  thumbnailUrl: string | null;
  githubUrl: string | null;
  tagIds: string[];
};

/** 개발 일기 수정 입력 */
export type UpdateDevLogInput = DevLogInput & { id: string };

/** 프로필 수정 입력. 이미지를 제거하면 avatarUrl이 null */
export type ProfileInput = {
  displayName: string;
  avatarUrl: string | null;
};

/** 오류 분류: 권한 없음 / 검증 실패 / 대상 없음 / 중복(slug 등) / 그 외 */
export type ActionErrorCode =
  "forbidden" | "validation" | "notFound" | "conflict" | "unknown";

/** 서버 액션 실패 정보. 필드별 오류는 fieldErrors, 그 외는 message */
export type ActionError = {
  code: ActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
};

/** 서버 액션 통일 반환 형태. 예외를 던지지 않고 이 값으로 성공·실패를 알린다 */
export type ActionResult<T> =
  { ok: true; data: T } | { ok: false; error: ActionError };

/** 작성·수정 성공 후 이동에 쓰는 글 식별자 */
export type PostRef = { id: string; slug: string };

/** 작성·수정 성공 후 이동에 쓰는 개발 일기 식별자 */
export type DevLogRef = { id: string };
