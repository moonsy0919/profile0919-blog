"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { EditorFields } from "@/components/editor-fields";
import { EditorFormFrame } from "@/components/editor-form-frame";
import { FormField } from "@/components/form-field";
import type { Post, Tag } from "@/lib/data";
import { createPost, updatePost } from "@/lib/data/actions";
import { saveFormWithThumbnail } from "@/lib/save-form-with-thumbnail";
import { suggestSlug } from "@/lib/text/slug";
import { SAVE_FAILED_MESSAGE, useEditorFields } from "@/lib/use-editor-fields";
import { zodErrorToFieldErrors } from "@/lib/validation/errors";
import { type PostFormValues, postFormSchema } from "@/lib/validation/post";

type PostFormProps = {
  /** 태그 선택 후보 */
  tags: Tag[];
  /** 수정 모드면 상세가 이미 조회한 글. 없으면 작성 모드 */
  post?: Post;
  /** 수정 모드의 [취소]·이탈 주소 (edit만 제거하고 tag/page는 유지한 읽기 모드) */
  cancelHref?: string;
  /** 수정 후 읽기 모드로 돌아갈 때 붙일 쿼리 (tag/page 유지, 예: ?tag=React&page=2) */
  readQuery?: string;
};

/**
 * 게시글 작성·수정 폼의 상태와 동작을 관리한다.
 * 검증 → 더미 저장 → 결과 분기(이동·필드 오류·토스트)와 취소·이탈 확인을 다룬다.
 */
function usePostForm({ post, cancelHref, readQuery = "" }: PostFormProps) {
  const router = useRouter();
  const fields = useEditorFields({
    title: post?.title ?? "",
    content: post?.content ?? "",
    thumbnailUrl: post?.thumbnailUrl ?? null,
    tagIds: post?.tags.map((tag) => tag.id) ?? [],
  });
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const leaveHref = post ? (cancelHref ?? "/") : "/";
  const dirty = fields.dirty || slug !== (post?.slug ?? "");

  /** 결과를 화면에 반영한다 */
  function handleResult(
    result: Awaited<ReturnType<typeof createPost>>,
    values: PostFormValues,
  ) {
    if (result.ok) {
      toast.success(post ? "글이 수정되었습니다" : "글이 저장되었습니다");
      const path = `/posts/${values.slug}`;
      router.push((post ? `${path}${readQuery}` : path) as Route);
      return;
    }
    if (result.error.code === "notFound") {
      toast.error("글을 찾을 수 없습니다");
      router.push("/");
      return;
    }
    fields.setFieldErrors(result.error.fieldErrors ?? {});
    if (!result.error.fieldErrors) toast.error(SAVE_FAILED_MESSAGE);
  }

  /** 썸네일 업로드 → 저장 → 결과 분기. 업로드가 실패하면 저장하지 않고 입력값을 유지한다 */
  async function submit(values: PostFormValues) {
    fields.setSubmitting(true);
    const result = await saveFormWithThumbnail(fields, {
      folder: "posts",
      editing: Boolean(post),
      previousUrl: post?.thumbnailUrl ?? null,
      save: (thumbnailUrl) =>
        post
          ? updatePost({ id: post.id, ...values, thumbnailUrl })
          : createPost({ ...values, thumbnailUrl }),
    });
    fields.setSubmitting(false);
    if (result) handleResult(result, values);
  }

  /** 검증 → 저장 */
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = postFormSchema.safeParse({
      title: fields.title,
      slug,
      content: fields.content,
      thumbnailUrl: fields.savedThumbnailUrl,
      tagIds: fields.tagIds,
    });
    if (!parsed.success) {
      fields.setFieldErrors(zodErrorToFieldErrors(parsed.error));
      return;
    }
    fields.setFieldErrors({});
    await submit(parsed.data);
  }

  return {
    fields,
    slug,
    dirty,
    leaveHref,
    handleSubmit,
    /** 직접 고치면 이후 제목 변경이 slug를 덮어쓰지 않는다 */
    changeSlug: (value: string) => {
      setSlug(value);
      setSlugTouched(true);
    },
    /** 작성 모드에서 slug를 직접 고치기 전까지 제목에서 자동 제안한다 */
    suggestFromTitle: (title: string) => {
      if (!slugTouched) setSlug(suggestSlug(title));
    },
    handleCancel: () => {
      if (dirty) fields.setLeaveOpen(true);
      else router.push(leaveHref as Route);
    },
    leave: () => router.push(leaveHref as Route),
  };
}

/**
 * 게시글 작성·수정 폼. 수정 모드는 상세가 이미 조회한 값으로 시작한다.
 * 변경이 있을 때만 [취소]·새로고침에서 이탈을 확인한다. 새 썸네일은 [저장] 시점에 Storage로 올린다.
 * @param tags 태그 선택 후보
 * @param post 수정할 글 (없으면 작성)
 * @param cancelHref 수정 모드의 [취소] 이동 주소
 * @param readQuery 수정 후 읽기 모드 복귀 시 붙일 쿼리
 */
export function PostForm(props: PostFormProps) {
  const form = usePostForm(props);
  const { fields } = form;
  const editing = Boolean(props.post);
  const slugChanged = editing && form.slug !== props.post?.slug;

  return (
    <EditorFormFrame
      heading={editing ? "게시글 수정" : "게시글 작성"}
      submitLabel="저장"
      submitting={fields.submitting}
      submitDisabled={fields.submitBlocked}
      leaveOpen={fields.leaveOpen}
      onLeaveOpenChange={fields.setLeaveOpen}
      onSubmit={form.handleSubmit}
      onCancel={form.handleCancel}
      onLeave={form.leave}
    >
      <EditorFields
        fields={fields}
        tags={props.tags}
        onTitleChange={form.suggestFromTitle}
        afterTitle={
          <div className="flex flex-col gap-2">
            <FormField
              id="post-slug"
              label="slug"
              hint="주소에 쓰이는 영문 소문자·숫자·하이픈(-)"
              value={form.slug}
              disabled={fields.submitting}
              error={fields.fieldErrors.slug}
              onChange={(event) => form.changeSlug(event.target.value)}
            />
            {slugChanged ? (
              <p role="status" className="text-sm text-destructive">
                slug를 바꾸면 기존 주소(/posts/{props.post?.slug})로는 더 이상
                글에 접근할 수 없습니다.
              </p>
            ) : null}
          </div>
        }
      />
    </EditorFormFrame>
  );
}
