import {
  AVATAR_ACCEPT_TYPES,
  AVATAR_MAX_BYTES,
} from "@/lib/validation/constants";

/**
 * 프로필 이미지 파일을 선택 직후 클라이언트에서 선검증한다.
 * 서버 측 강제(버킷 제한)는 Task 023에서 따로 한다.
 * @param file 사용자가 고른 파일
 * @returns 통과하면 null, 아니면 화면에 보일 오류 문구
 */
export function validateAvatarFile(file: Pick<File, "type" | "size">) {
  if (!AVATAR_ACCEPT_TYPES.includes(file.type)) {
    return "PNG, JPG, GIF, WEBP 형식의 이미지만 올릴 수 있습니다";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return "이미지는 5MB 이하로 올려 주세요";
  }
  return null;
}
