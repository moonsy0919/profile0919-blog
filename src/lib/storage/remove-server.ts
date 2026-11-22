import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  type ImageFolder,
  objectPathFromPublicUrl,
  THUMBNAIL_BUCKET,
} from "./paths";

/**
 * 글을 지운 뒤 서버에서 이미지 객체를 정리한다. 사용자(관리자) 세션의 서버 클라이언트로 지우므로 Storage 관리자 정책이 그대로 적용된다.
 * 이 버킷의 지정 폴더 주소일 때만 지우고(외부 URL·사이트 내부 경로·다른 폴더는 건드리지 않는다),
 * 정리 작업이라 실패하거나 예외가 나도 던지지 않고 로그만 남긴다(고아 파일 허용, PRD 가정 24).
 * @param url 글의 썸네일 주소 (없으면 아무것도 하지 않는다)
 * @param folder 허용할 폴더 (게시글은 posts, 개발 일기는 dev-logs)
 */
export async function removeBucketImage(
  url: string | null | undefined,
  folder: ImageFolder,
): Promise<void> {
  const path = objectPathFromPublicUrl(url, [folder]);
  if (!path) return;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from(THUMBNAIL_BUCKET)
      .remove([path]);
    if (error) console.error("이미지 삭제 실패", path, error);
    else if (data.length === 0)
      console.error("삭제된 이미지 객체가 없습니다", path);
  } catch (error) {
    console.error("이미지 삭제 중 예외", path, error);
  }
}
