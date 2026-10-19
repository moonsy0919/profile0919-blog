import { z } from "zod";
import {
  DISPLAY_NAME_MAX,
  RESERVED_SLUGS,
  SLUG_MAX,
  TAGS_PER_POST_MAX,
  TAG_NAME_MAX,
  TITLE_MAX,
  URL_MAX,
} from "@/lib/validation/constants";

/*
 * 폼 필드 단위 스키마. 게시글·개발 일기·프로필 폼과 서버 액션이 같은 규칙을 쓰도록 한 곳에 둔다.
 * 오류 메시지는 화면에 그대로 보이므로 한국어 문장으로 쓴다.
 */

/** slug 형식: 소문자·숫자 덩어리를 하이픈 하나로 잇는다 (DB posts_slug_format과 같다) */
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** GitHub URL 접두사 (DB github_url check와 같다. 대소문자는 구분하지 않는다) */
const GITHUB_URL_PATTERN = /^https:\/\/github\.com\//i;

/**
 * 태그 이름을 정규화한다. 앞뒤 공백 제거, 연속 공백은 한 칸, 선행 #은 제거한다.
 * TagPicker가 기존 태그와 비교할 때도 같은 규칙을 쓰도록 export한다.
 * @param name 입력한 태그 이름
 */
export function normalizeTagName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^#+\s*/, "")
    .trim();
}

/**
 * 문자열이 URL로 해석되고 http/https인지 확인한다.
 * @param value 검사할 문자열
 */
function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * 선택 URL 입력을 정리한다. 비어 있거나 공백뿐이면 null로 바꾼다.
 * @param value 입력값 (undefined·null 허용)
 */
function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** 제목: 앞뒤 공백을 지운 뒤 1~100자 */
export const titleSchema = z
  .string()
  .trim()
  .min(1, "제목을 입력해 주세요")
  .max(TITLE_MAX, `제목은 ${TITLE_MAX}자 이하로 입력해 주세요`);

/** 본문: 공백만으로 이루어지면 안 된다. 마크다운 줄바꿈을 지키려고 값은 다듬지 않는다 */
export const contentSchema = z
  .string()
  .refine((value) => value.trim().length > 0, "본문을 입력해 주세요");

/** slug: 영문 소문자·숫자·하이픈, 예약어(new) 불가 */
export const slugSchema = z
  .string()
  .trim()
  .min(1, "slug를 입력해 주세요")
  .max(SLUG_MAX, `slug는 ${SLUG_MAX}자 이하로 입력해 주세요`)
  .regex(
    SLUG_PATTERN,
    "slug는 영문 소문자, 숫자, 하이픈(-)만 쓸 수 있고 하이픈으로 시작하거나 끝날 수 없습니다",
  )
  .refine(
    (value) => !RESERVED_SLUGS.includes(value),
    "사용할 수 없는 slug입니다",
  );

/** 태그 이름: 정규화한 뒤 1~20자 */
export const tagNameSchema = z
  .string()
  .transform(normalizeTagName)
  .pipe(
    z
      .string()
      .min(1, "태그 이름을 입력해 주세요")
      .max(TAG_NAME_MAX, `태그는 ${TAG_NAME_MAX}자 이하로 입력해 주세요`),
  );

/** 선택한 태그 id 목록: 중복을 지운 뒤 최대 10개 */
export const tagIdsSchema = z
  .array(z.string().min(1))
  .transform((ids) => [...new Set(ids)])
  .pipe(
    z
      .array(z.string())
      .max(
        TAGS_PER_POST_MAX,
        `태그는 최대 ${TAGS_PER_POST_MAX}개까지 선택할 수 있습니다`,
      ),
  );

/** 프로필 표시 이름: 앞뒤 공백을 지운 뒤 1~30자 */
export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "표시 이름을 입력해 주세요")
  .max(
    DISPLAY_NAME_MAX,
    `표시 이름은 ${DISPLAY_NAME_MAX}자 이하로 입력해 주세요`,
  );

/** GitHub 저장소 URL: 선택 값. 비우면 null, 입력하면 https://github.com/ 로 시작해야 한다 */
export const githubUrlSchema = z
  .string()
  .max(URL_MAX, "URL이 너무 깁니다")
  .nullish()
  .transform(emptyToNull)
  .refine(
    (value) =>
      value === null || (GITHUB_URL_PATTERN.test(value) && isHttpUrl(value)),
    "https://github.com/ 로 시작하는 주소를 입력해 주세요",
  );

/**
 * 썸네일(이미지) URL: 선택 값. 비우면 null, 입력하면 http(s) 주소여야 한다.
 * 이 버킷 경로인지는 업로드·서버 액션 단계(Task 020·021)에서 따로 검증한다.
 */
export const thumbnailUrlSchema = z
  .string()
  .max(URL_MAX, "URL이 너무 깁니다")
  .nullish()
  .transform(emptyToNull)
  .refine(
    (value) => value === null || isHttpUrl(value),
    "올바른 이미지 주소가 아닙니다",
  );
