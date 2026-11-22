import { toast } from "sonner";
import type { ActionResult } from "@/lib/data/types";
import type { ImageFolder } from "@/lib/storage/paths";
import { isUploadFailure, saveWithImage } from "@/lib/storage/save-with-image";
import type { useEditorFields } from "@/lib/use-editor-fields";

/** 게시글·개발 일기 폼이 공유하는 필드 상태 */
type EditorFieldsState = ReturnType<typeof useEditorFields>;

/** saveFormWithThumbnail 입력 */
type SaveFormParams<T> = {
  /** 새 썸네일을 올릴 폴더 */
  folder: ImageFolder;
  /** 수정 모드인지 (정리 규칙이 달라진다) */
  editing: boolean;
  /** 저장돼 있던 썸네일 주소 (작성 모드는 null) */
  previousUrl: string | null;
  /** 서버 액션 호출. 썸네일은 주소 문자열(또는 null)만 받는다 */
  save: (thumbnailUrl: string | null) => Promise<ActionResult<T>>;
};

/**
 * 폼의 썸네일 상태를 읽어 업로드 → 저장 → 이미지 정리를 수행한다.
 * 파일이 있으면 업로드 중 상태를 켜고, 업로드가 실패하면 저장을 호출하지 않고 안내만 보인다(입력값은 유지).
 * @param fields useEditorFields가 돌려준 필드 상태
 * @param params 폴더·모드·기존 주소·저장 콜백
 * @returns 서버 액션 결과. 업로드 실패로 저장 전에 멈추면 null
 */
export async function saveFormWithThumbnail<T>(
  fields: EditorFieldsState,
  { folder, editing, previousUrl, save }: SaveFormParams<T>,
): Promise<ActionResult<T> | null> {
  const { file, removed } = fields.thumbnail;
  fields.setUploadError(null);
  fields.setUploading(file !== null);
  try {
    const result = await saveWithImage({
      folder,
      file,
      removed,
      previousUrl,
      mode: editing ? "update" : "create",
      save,
    });
    if (!isUploadFailure(result)) return result;
    fields.setUploadError(result.message);
    toast.error(result.message);
    return null;
  } finally {
    fields.setUploading(false);
  }
}
