import { createClient } from "@/lib/supabase/client";
import { validateAvatarFile } from "@/lib/validation/avatar";
import { buildObjectPath, type ImageFolder, THUMBNAIL_BUCKET } from "./paths";

/** 업로드·삭제에 필요한 Supabase 클라이언트. 테스트에서 목으로 바꿔 끼울 수 있다 */
export type StorageClient = Pick<ReturnType<typeof createClient>, "storage">;

/** 업로드 결과. 실패해도 예외를 던지지 않고 이 값으로 알린다 */
export type UploadResult =
  { ok: true; url: string; path: string } | { ok: false; message: string };

/** 업로드 실패 시 화면에 보일 문구 */
export const UPLOAD_FAILED_MESSAGE =
  "이미지를 올리지 못했습니다. 다시 시도해 주세요";

/**
 * 이미지를 브라우저에서 Storage 버킷으로 직접 올린다. 파일 본문은 서버 액션을 거치지 않는다.
 * 선검증(형식·5MB)을 통과한 파일만 올리며, 이미 있는 객체를 덮어쓰지 않는다.
 * 관리자 세션이 아니면 Storage 정책에 막혀 실패 결과가 된다.
 * @param file 사용자가 고른 이미지
 * @param folder 저장할 폴더(posts·dev-logs·profile)
 * @param client 테스트용 클라이언트 (기본은 브라우저 클라이언트)
 */
export async function uploadImage(
  file: File,
  folder: ImageFolder,
  client?: StorageClient,
): Promise<UploadResult> {
  const invalid = validateAvatarFile(file);
  if (invalid) return { ok: false, message: invalid };

  try {
    const bucket = (client ?? createClient()).storage.from(THUMBNAIL_BUCKET);
    const path = buildObjectPath(folder, file.type);
    const { error } = await bucket.upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      console.error("이미지 업로드 실패", error);
      return { ok: false, message: UPLOAD_FAILED_MESSAGE };
    }
    return { ok: true, url: bucket.getPublicUrl(path).data.publicUrl, path };
  } catch (error) {
    console.error("이미지 업로드 중 예외", error);
    return { ok: false, message: UPLOAD_FAILED_MESSAGE };
  }
}

/**
 * 버킷의 객체를 지운다. 정리 작업이라 실패해도 예외를 던지지 않고 로그만 남긴다(고아 파일 허용).
 * @param paths 지울 객체 경로 목록
 * @param client 테스트용 클라이언트 (기본은 브라우저 클라이언트)
 */
export async function deleteImages(
  paths: string[],
  client?: StorageClient,
): Promise<void> {
  if (paths.length === 0) return;
  try {
    const bucket = (client ?? createClient()).storage.from(THUMBNAIL_BUCKET);
    const { error } = await bucket.remove(paths);
    if (error) console.error("이미지 삭제 실패", paths, error);
  } catch (error) {
    console.error("이미지 삭제 중 예외", paths, error);
  }
}
