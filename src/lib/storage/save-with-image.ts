import type { ActionResult } from "@/lib/data/types";
import { type ImageFolder, objectPathFromPublicUrl } from "./paths";
import { deleteImages, uploadImage } from "./upload";

/** 이미지 업로드가 실패해 저장까지 가지 못했다는 결과 */
export type UploadFailure = {
  ok: false;
  uploadFailed: true;
  message: string;
};

/** 저장 결과. 서버 액션 결과이거나, 저장 전에 멈춘 업로드 실패다 */
export type SaveWithImageResult<T> = ActionResult<T> | UploadFailure;

/** saveWithImage 입력 */
export type SaveWithImageParams<T> = {
  /** 새 이미지를 올릴 폴더 */
  folder: ImageFolder;
  /** 새로 고른 파일 (없으면 null) */
  file: File | null;
  /** 기존 이미지를 제거했는지 */
  removed: boolean;
  /** 저장돼 있던 이미지 주소 (작성 모드는 null) */
  previousUrl: string | null;
  /** 작성은 저장 실패 때만, 수정은 저장 성공 때만 이전 이미지를 정리한다 */
  mode: "create" | "update";
  /** 서버 액션 호출. 이미지는 주소 문자열만 받으며 파일 본문은 넘기지 않는다 */
  save: (imageUrl: string | null) => Promise<ActionResult<T>>;
};

/**
 * 결과가 저장 전에 멈춘 업로드 실패인지 확인한다.
 * @param result saveWithImage의 결과
 */
export function isUploadFailure<T>(
  result: SaveWithImageResult<T>,
): result is UploadFailure {
  return !result.ok && "uploadFailed" in result;
}

/**
 * 이미지 업로드 → 저장 → 이미지 정리를 정해진 순서로 처리한다.
 * 업로드가 실패하면 저장을 호출하지 않는다. 저장은 이미지 주소만 받는다.
 * 작성: 저장 실패 시 방금 올린 객체를 지운다.
 * 수정: 저장 성공 시에만 이전 객체를 지우고(이 버킷의 주소일 때만), 저장 실패 시 새 객체만 지운다.
 * @param params 폴더·파일·기존 주소·모드·저장 콜백
 */
export async function saveWithImage<T>(
  params: SaveWithImageParams<T>,
): Promise<SaveWithImageResult<T>> {
  const { folder, file, removed, previousUrl, mode, save } = params;
  const uploaded = file ? await uploadImage(file, folder) : null;
  if (uploaded && !uploaded.ok) {
    return { ok: false, uploadFailed: true, message: uploaded.message };
  }
  const newPath = uploaded?.ok ? uploaded.path : null;
  const imageUrl = uploaded?.ok ? uploaded.url : removed ? null : previousUrl;

  const outcome = await callSave(save, imageUrl);
  if (outcome.thrown) return outcome.result;
  if (!outcome.result.ok) {
    await cleanupAfterFailure(newPath);
  } else if (mode === "update" && (newPath || removed)) {
    await cleanupAfterSuccess(previousUrl);
  }
  return outcome.result;
}

/**
 * 저장 콜백을 호출한다. 서버 액션은 예외를 던지지 않는 것이 약속이지만 네트워크 단절 등으로 던질 수 있다.
 * 예외는 저장 성공 여부를 알 수 없는 상태이므로, 이미 저장됐을 수 있는 이미지를 지우지 않도록 구분해 알린다.
 */
async function callSave<T>(
  save: (imageUrl: string | null) => Promise<ActionResult<T>>,
  imageUrl: string | null,
): Promise<{ result: ActionResult<T>; thrown: boolean }> {
  try {
    return { result: await save(imageUrl), thrown: false };
  } catch (error) {
    console.error("저장 호출 중 예외", error);
    const message = "저장하지 못했습니다. 다시 시도해 주세요";
    return {
      result: { ok: false, error: { code: "unknown", message } },
      thrown: true,
    };
  }
}

/** 저장 실패 후 방금 올린 새 객체만 지운다. 이전 객체는 그대로 둔다 */
async function cleanupAfterFailure(newPath: string | null): Promise<void> {
  if (newPath) await deleteImages([newPath]);
}

/** 저장 성공 후 이전 객체를 지운다. 이 버킷의 주소가 아니면(외부 URL·내부 경로) 건드리지 않는다 */
async function cleanupAfterSuccess(previousUrl: string | null): Promise<void> {
  const previousPath = objectPathFromPublicUrl(previousUrl);
  if (previousPath) await deleteImages([previousPath]);
}
