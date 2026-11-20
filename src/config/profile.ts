/**
 * 헤더 중앙 프로필의 기본값. DB(profiles)에 행이 없거나 값이 비었거나 조회에 실패했을 때 폴백으로 쓴다.
 * 클라이언트 컴포넌트도 가져다 쓰므로 환경 변수에 의존하지 않는 정적 값만 둔다.
 */
export const profileConfig = {
  /** 기본 표시 이름 */
  displayName: "profile0919",
  /** 기본 프로필 이미지(public/ 기준 경로) */
  avatarUrl: "/default-avatar.svg",
} as const;
