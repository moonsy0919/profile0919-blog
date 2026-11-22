import { AVATAR_ACCEPT_TYPES } from "@/lib/validation/constants";

/** 이미지를 저장하는 Storage 버킷 이름 */
export const THUMBNAIL_BUCKET = "thumbnails";

/** 버킷 안에서 쓰는 폴더(경로 접두어). 글 썸네일·개발 일기 썸네일·프로필 이미지 */
export const IMAGE_FOLDERS = ["posts", "dev-logs", "profile"] as const;

/** 이미지 폴더 이름 */
export type ImageFolder = (typeof IMAGE_FOLDERS)[number];

/** MIME 형식별 파일 확장자 */
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

/** 공개 URL에서 객체 경로 앞에 붙는 고정 경로 */
const PUBLIC_PATH_PREFIX = `/storage/v1/object/public/${THUMBNAIL_BUCKET}/`;

/**
 * 업로드할 객체 경로를 만든다. 한글·공백 파일명 문제와 이름 충돌을 피하려고 uuid를 쓴다.
 * @param folder 저장할 폴더
 * @param mimeType 파일의 MIME 형식 (PNG/JPG/GIF/WEBP만 허용)
 * @returns `folder/{uuid}.{ext}` 형식의 경로
 * @throws 허용하지 않는 MIME 형식이면 오류. 호출 전에 선검증을 거쳐야 한다
 */
export function buildObjectPath(folder: ImageFolder, mimeType: string): string {
  const extension = EXTENSION_BY_MIME[mimeType];
  if (!extension || !AVATAR_ACCEPT_TYPES.includes(mimeType)) {
    throw new Error(`허용하지 않는 이미지 형식입니다: ${mimeType}`);
  }
  return `${folder}/${crypto.randomUUID()}.${extension}`;
}

/**
 * 주소가 이 프로젝트 버킷의 공개 URL이면 객체 경로를 돌려준다.
 * 외부 URL·사이트 내부 경로·허용 폴더 밖·하위 폴더가 있는 경로는 null이다.
 * 서버 액션과 브라우저가 함께 쓰므로 환경 변수만 읽는다.
 * @param url 검사할 이미지 주소
 * @param folders 허용할 폴더 (기본은 전체)
 */
export function objectPathFromPublicUrl(
  url: string | null | undefined,
  folders: readonly ImageFolder[] = IMAGE_FOLDERS,
): string | null {
  const parsed = parseUrl(url);
  const base = parseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!parsed || !base || parsed.origin !== base.origin) return null;
  if (!parsed.pathname.startsWith(PUBLIC_PATH_PREFIX)) return null;

  // 원문을 먼저 나눈 뒤 디코딩한다. 인코딩된 슬래시(%2F)가 경로 구분자로 둔갑하지 않게 하기 위해서다
  const segments = parsed.pathname
    .slice(PUBLIC_PATH_PREFIX.length)
    .split("/")
    .map(safeDecode);
  const [folder, name, ...rest] = segments;
  const allowed = folders.includes(folder as ImageFolder);
  if (!allowed || !name || rest.length > 0) return null;
  if (name === "." || name === ".." || name.includes("/")) return null;
  return `${folder}/${name}`;
}

/**
 * 이 버킷에 올린 이미지의 주소인지 확인한다. 이전 이미지를 지워도 되는지 판단할 때 쓴다.
 * @param url 검사할 이미지 주소
 * @param folders 허용할 폴더 (기본은 전체)
 */
export function isBucketImageUrl(
  url: string | null | undefined,
  folders: readonly ImageFolder[] = IMAGE_FOLDERS,
): boolean {
  return objectPathFromPublicUrl(url, folders) !== null;
}

/** 절대 URL만 파싱한다. 상대 경로·빈 값·잘못된 값은 null */
function parseUrl(value: string | null | undefined): URL | null {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/** 퍼센트 인코딩을 풀되, 잘못된 인코딩이면 원문을 그대로 쓴다 */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
