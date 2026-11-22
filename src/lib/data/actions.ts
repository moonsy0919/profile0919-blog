"use server";

import { createClient } from "@/lib/supabase/server";
import { tagNameSchema } from "@/lib/validation/fields";
import { dummyDevLogs } from "./dummy/devLogs";
import { dummyPosts } from "./dummy/posts";
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
 * 쓰기 서버 액션. `createTag`만 실구현(Task 020)이고 나머지는 더미다.
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

/**
 * 다른 글이 이미 쓰는 slug인지 확인한다.
 * @param slug 확인할 slug
 * @param ownId 수정 중인 글 id (자기 자신은 제외)
 */
function isSlugTaken(slug: string, ownId?: string): boolean {
  return dummyPosts.some((post) => post.slug === slug && post.id !== ownId);
}

/**
 * 게시글을 작성한다. 이미 있는 slug면 slug 필드 오류(conflict)다.
 * @param input 제목·slug·본문·썸네일 URL·태그 id
 */
export async function createPost(
  input: PostInput,
): Promise<ActionResult<PostRef>> {
  if (isSlugTaken(input.slug)) {
    return fail("conflict", "이미 사용 중인 slug입니다.", {
      slug: "이미 사용 중인 slug입니다.",
    });
  }
  return succeed({ id: "post-new", slug: input.slug });
}

/**
 * 게시글을 수정한다. 대상이 없으면 notFound, slug 중복이면 conflict다.
 * @param input 글 id와 수정할 값
 */
export async function updatePost(
  input: UpdatePostInput,
): Promise<ActionResult<PostRef>> {
  if (!dummyPosts.some((post) => post.id === input.id)) {
    return fail("notFound", "글을 찾을 수 없습니다.");
  }
  if (isSlugTaken(input.slug, input.id)) {
    return fail("conflict", "이미 사용 중인 slug입니다.", {
      slug: "이미 사용 중인 slug입니다.",
    });
  }
  return succeed({ id: input.id, slug: input.slug });
}

/**
 * 게시글을 삭제한다. 이미 없으면 notFound다.
 * @param id 삭제할 글 id
 */
export async function deletePost(id: string): Promise<ActionResult<null>> {
  if (!dummyPosts.some((post) => post.id === id)) {
    return fail("notFound", "이미 삭제된 글입니다.");
  }
  return succeed(null);
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
