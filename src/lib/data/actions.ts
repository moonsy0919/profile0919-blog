"use server";

import { revalidatePath } from "next/cache";
import { isBucketImageUrl } from "@/lib/storage/paths";
import { removeBucketImage } from "@/lib/storage/remove-server";
import { createClient } from "@/lib/supabase/server";
import { zodErrorToFieldErrors } from "@/lib/validation/errors";
import { tagNameSchema } from "@/lib/validation/fields";
import { postFormSchema } from "@/lib/validation/post";
import { dummyDevLogs } from "./dummy/devLogs";
import { getViewer } from "./reads";
import type {
  ActionErrorCode,
  ActionResult,
  DevLogInput,
  DevLogRef,
  PostInput,
  PostRef,
  Profile,
  ProfileInput,
  Tag,
  UpdateDevLogInput,
  UpdatePostInput,
} from "./types";

/*
 * 쓰기 서버 액션. `createTag`(Task 020)·`createPost`(021-C)·`updatePost`(021-U)·`deletePost`(021-D)만 실구현이고 나머지는 더미다.
 * 더미는 데이터를 실제로 바꾸지 않고 시그니처와 반환 형태만 고정한다.
 * 관리자 재검증·Zod 검증·revalidatePath는 Task 006·016·021~023에서 이 파일 안에 채운다.
 * 프로덕션 보호는 이 함수를 부르는 더미 경로의 라우트 게이트(assertDevOnly)가 맡는다.
 * 'use server' 파일은 async 함수만 export할 수 있으므로 헬퍼는 export하지 않는다.
 */

/** 성공 결과를 만든다 */
function succeed<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

/** 실패 결과를 만든다. 예외 대신 이 값을 돌려준다 */
function fail<T>(
  code: ActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string>,
): ActionResult<T> {
  return { ok: false, error: { code, message, fieldErrors } };
}

/** 게시글 저장에 실패했을 때 보일 문구 */
const POST_SAVE_FAILED_MESSAGE = "저장하지 못했습니다. 다시 시도해 주세요";

/** slug 중복 문구 */
const SLUG_TAKEN_MESSAGE = "이미 사용 중인 slug입니다.";

/** 수정 대상 글이 없을 때 문구 */
const POST_NOT_FOUND_MESSAGE = "글을 찾을 수 없습니다.";

/** uuid 형식. 형식이 아닌 id는 DB를 부르지 않고 "없음"으로 본다(Postgres 22P02가 일반 오류가 되는 것 방지) */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 게시글 입력을 검증한다. Zod 스키마(폼과 공용) 뒤에 썸네일을 확인한다.
 * 썸네일은 이 버킷의 `posts/` 경로이거나 수정 전 값과 같을 때만 허용한다(버킷 밖 기존 값을 그대로 두는 수정을 막지 않기 위해).
 * @param input 폼이 보낸 입력
 * @param currentThumbnail 수정 전 썸네일 주소 (작성이면 null)
 */
function parsePostInput(
  input: PostInput,
  currentThumbnail: string | null,
): ActionResult<PostInput> {
  const parsed = postFormSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = zodErrorToFieldErrors(parsed.error);
    const message = Object.values(fieldErrors)[0] ?? "입력값을 확인해 주세요";
    return fail("validation", message, fieldErrors);
  }
  const { thumbnailUrl } = parsed.data;
  const allowed =
    !thumbnailUrl ||
    isBucketImageUrl(thumbnailUrl, ["posts"]) ||
    thumbnailUrl === currentThumbnail;
  if (!allowed) {
    const message = "허용되지 않는 이미지 주소입니다";
    return fail("validation", message, { thumbnailUrl: message });
  }
  return succeed(parsed.data);
}

/**
 * 사용자 세션의 서버 클라이언트로 `save_post`를 호출한다(security invoker라 RLS가 적용된다).
 * slug 중복(23505)은 slug 필드 오류(conflict), 수정 대상 없음(P0002)은 notFound, 그 외·빈 행·예외는 일반 오류(unknown)다.
 * @param id 수정할 글 id (작성이면 null)
 * @param input 검증을 통과한 입력
 */
async function callSavePost(
  id: string | null,
  input: PostInput,
): Promise<ActionResult<PostRef>> {
  try {
    const supabase = await createClient();
    // 생성 타입이 nullable 인자를 표현하지 못해 null(id 없음·썸네일 없음)은 단언으로 넘긴다
    const { data, error } = await supabase.rpc("save_post", {
      p_id: id as string,
      p_slug: input.slug,
      p_title: input.title,
      p_content: input.content,
      p_thumbnail_url: input.thumbnailUrl as string,
      p_tag_ids: input.tagIds,
    });
    if (error?.code === "23505") {
      return fail("conflict", SLUG_TAKEN_MESSAGE, { slug: SLUG_TAKEN_MESSAGE });
    }
    if (error?.code === "P0002")
      return fail("notFound", POST_NOT_FOUND_MESSAGE);
    if (error || !data?.id) {
      console.error("게시글 저장 실패", error);
      return fail("unknown", POST_SAVE_FAILED_MESSAGE);
    }
    return succeed({ id: data.id, slug: data.slug });
  } catch (error) {
    console.error("게시글 저장 중 예외", error);
    return fail("unknown", POST_SAVE_FAILED_MESSAGE);
  }
}

/** 저장 직전 글의 slug와 썸네일 주소 */
type PostBefore = { slug: string; thumbnailUrl: string | null };

/**
 * 수정 전 글의 slug·썸네일을 조회한다(이전 slug 경로 재검증과 썸네일 허용 판정에 쓴다).
 * 행이 없으면 notFound, 조회 실패·예외는 unknown이다.
 * @param id 글 id
 */
async function readPostBefore(id: string): Promise<ActionResult<PostBefore>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select("slug, thumbnail_url")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      console.error("수정 전 글 조회 실패", error);
      return fail("unknown", POST_SAVE_FAILED_MESSAGE);
    }
    if (!data) return fail("notFound", POST_NOT_FOUND_MESSAGE);
    return succeed({ slug: data.slug, thumbnailUrl: data.thumbnail_url });
  } catch (error) {
    console.error("수정 전 글 조회 중 예외", error);
    return fail("unknown", POST_SAVE_FAILED_MESSAGE);
  }
}

/**
 * 목록(`/`)과 글 상세 경로를 재검증한다. slug가 바뀐 수정이면 이전 slug 경로도 함께 넘긴다.
 * @param slugs 재검증할 글 slug들
 */
function revalidatePostPaths(slugs: string[]): void {
  revalidatePath("/");
  for (const slug of new Set(slugs)) revalidatePath(`/posts/${slug}`);
}

/**
 * 게시글을 작성한다. 관리자 재검증 → 입력·이미지 URL 검증 → `save_post` → 캐시 재검증 순서다.
 * 권한 없음(forbidden)·검증 실패(validation)·slug 중복(conflict)·그 외(unknown)로 알리고 예외는 던지지 않는다.
 * @param input 제목·slug·본문·썸네일 URL·태그 id
 */
export async function createPost(
  input: PostInput,
): Promise<ActionResult<PostRef>> {
  const viewer = await getViewer();
  if (!viewer.isAdmin) return fail("forbidden", "권한이 없습니다.");

  const parsed = parsePostInput(input, null);
  if (!parsed.ok) return parsed;

  const result = await callSavePost(null, parsed.data);
  if (result.ok) revalidatePostPaths([result.data.slug]);
  return result;
}

/**
 * 게시글을 수정한다. 관리자 재검증 → id 형식 → 수정 전 글 조회 → 입력·이미지 URL 검증 → `save_post`(기존 id) → 캐시 재검증 순서다.
 * 대상이 없으면(이미 삭제됨 포함) notFound, slug 중복이면 slug 필드 conflict다. slug가 바뀌면 이전 slug 경로도 재검증한다.
 * @param input 글 id와 수정할 값
 */
export async function updatePost(
  input: UpdatePostInput,
): Promise<ActionResult<PostRef>> {
  const viewer = await getViewer();
  if (!viewer.isAdmin) return fail("forbidden", "권한이 없습니다.");
  if (!UUID_PATTERN.test(input.id)) {
    return fail("notFound", POST_NOT_FOUND_MESSAGE);
  }

  const before = await readPostBefore(input.id);
  if (!before.ok) return before;
  const parsed = parsePostInput(input, before.data.thumbnailUrl);
  if (!parsed.ok) return parsed;

  const result = await callSavePost(input.id, parsed.data);
  if (result.ok) revalidatePostPaths([before.data.slug, result.data.slug]);
  return result;
}

/** 글 삭제 결과 문구 */
const POST_ALREADY_DELETED_MESSAGE = "이미 삭제된 글입니다.";
const POST_DELETE_FAILED_MESSAGE = "삭제하지 못했습니다. 다시 시도해 주세요";

/**
 * `posts` 행을 지운다(`post_tags`는 on delete cascade). 사용자 세션이라 RLS가 적용된다.
 * 삭제된 행이 없으면(조회 뒤 동시 삭제·권한 없음) 오류 없이 0행이므로 notFound로 본다.
 * @param id 삭제할 글 id
 */
async function deletePostRecord(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) {
      console.error("게시글 삭제 실패", error);
      return fail("unknown", POST_DELETE_FAILED_MESSAGE);
    }
    if (data.length === 0) {
      return fail("notFound", POST_ALREADY_DELETED_MESSAGE);
    }
    return succeed(null);
  } catch (error) {
    console.error("게시글 삭제 중 예외", error);
    return fail("unknown", POST_DELETE_FAILED_MESSAGE);
  }
}

/**
 * 게시글을 삭제한다. 관리자 재검증 → id 형식 → 삭제 전 글(slug·썸네일) 조회 → DB 삭제 → 캐시 재검증 → Storage 정리 순서다.
 * DB 삭제 성공이 기준이라 Storage 정리가 실패해도 로그만 남기고 성공으로 돌려준다(고아 파일 허용).
 * 이미 없으면(삭제됨 포함) notFound다.
 * @param id 삭제할 글 id
 */
export async function deletePost(id: string): Promise<ActionResult<null>> {
  const viewer = await getViewer();
  if (!viewer.isAdmin) return fail("forbidden", "권한이 없습니다.");
  if (!UUID_PATTERN.test(id)) {
    return fail("notFound", POST_ALREADY_DELETED_MESSAGE);
  }

  const before = await readPostBefore(id);
  if (!before.ok) {
    return before.error.code === "notFound"
      ? fail("notFound", POST_ALREADY_DELETED_MESSAGE)
      : fail("unknown", POST_DELETE_FAILED_MESSAGE);
  }
  const result = await deletePostRecord(id);
  if (!result.ok) return result;

  revalidatePostPaths([before.data.slug]);
  await removeBucketImage(before.data.thumbnailUrl, "posts");
  return result;
}

/**
 * 개발 일기를 게시한다.
 * @param input 제목·본문·썸네일 URL·GitHub URL·태그 id
 */
export async function createDevLog(
  input: DevLogInput,
): Promise<ActionResult<DevLogRef>> {
  void input;
  return succeed({ id: "devlog-new" });
}

/**
 * 개발 일기를 수정한다. 대상이 없으면 notFound다.
 * @param input 일기 id와 수정할 값
 */
export async function updateDevLog(
  input: UpdateDevLogInput,
): Promise<ActionResult<DevLogRef>> {
  if (!dummyDevLogs.some((devLog) => devLog.id === input.id)) {
    return fail("notFound", "개발 일기를 찾을 수 없습니다.");
  }
  return succeed({ id: input.id });
}

/**
 * 개발 일기를 삭제한다. 이미 없으면 notFound다.
 * @param id 삭제할 개발 일기 id
 */
export async function deleteDevLog(id: string): Promise<ActionResult<null>> {
  if (!dummyDevLogs.some((devLog) => devLog.id === id)) {
    return fail("notFound", "이미 삭제된 개발 일기입니다.");
  }
  return succeed(null);
}

/** 태그 등록에 실패했을 때 보일 문구 */
const TAG_FAILED_MESSAGE = "태그를 추가하지 못했습니다. 다시 시도해 주세요";

/**
 * 태그를 추가한다. 관리자 재검증 → 이름 검증 → `add_tag` DB 함수 순서로 처리한다.
 * 대소문자 무시로 이미 있으면 새로 만들지 않고 기존 태그(최초 등록 표기)를 돌려준다.
 * 예외를 던지지 않고 권한 없음(forbidden)·검증 실패(validation)·그 외(unknown)로 알린다.
 * @param name 새 태그 이름 (앞뒤 공백·`#`은 검증 단계에서 정리된다)
 */
export async function createTag(name: string): Promise<ActionResult<Tag>> {
  const viewer = await getViewer();
  if (!viewer.isAdmin) return fail("forbidden", "권한이 없습니다.");

  const parsed = tagNameSchema.safeParse(name);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "태그 이름을 확인해 주세요";
    return fail("validation", message, { name: message });
  }
  return addTagRecord(parsed.data);
}

/**
 * 사용자 세션의 서버 클라이언트로 `add_tag`를 호출한다(security invoker라 RLS가 적용된다).
 * 행이 돌아오지 않으면(권한·정책으로 등록이 막힌 경우 포함) 실패로 본다.
 */
async function addTagRecord(tagName: string): Promise<ActionResult<Tag>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("add_tag", {
      tag_name: tagName,
    });
    if (error || !data?.id) {
      console.error("태그 등록 실패", error);
      return fail("unknown", TAG_FAILED_MESSAGE);
    }
    return succeed({ id: data.id, name: data.name });
  } catch (error) {
    console.error("태그 등록 중 예외", error);
    return fail("unknown", TAG_FAILED_MESSAGE);
  }
}

/**
 * 프로필(표시 이름·이미지)을 수정한다.
 * @param input 표시 이름과 이미지 URL
 */
export async function updateProfile(
  input: ProfileInput,
): Promise<ActionResult<Profile>> {
  return succeed({ id: "profile-admin", ...input });
}
