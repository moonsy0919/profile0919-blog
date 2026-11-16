"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { EditorFields } from "@/components/editor-fields";
import { EditorFormFrame } from "@/components/editor-form-frame";
import { FormField } from "@/components/form-field";
import type { DevLog, Tag } from "@/lib/data";
import { createDevLog, updateDevLog } from "@/lib/data/actions";
import { SAVE_FAILED_MESSAGE, useEditorFields } from "@/lib/use-editor-fields";
import { devLogFormSchema } from "@/lib/validation/dev-log";
import { zodErrorToFieldErrors } from "@/lib/validation/errors";

type DevLogFormProps = {
  /** 태그 선택 후보 */
  tags: Tag[];
  /** 수정 모드면 상세가 이미 조회한 개발 일기. 없으면 게시(작성) 모드 */
  devLog?: DevLog;
  /** 수정 모드의 [취소]·저장 후 이동 주소 (edit만 제거하고 page는 유지한 읽기 모드) */
  cancelHref?: string;
};

/**
 * 개발 일기 작성·수정 폼의 상태와 동작을 관리한다.
 * GitHub URL의 null은 빈 입력으로 다루고, dirty 비교에서도 null과 빈 문자열을 같게 본다.
 */
function useDevLogForm({ devLog, cancelHref }: DevLogFormProps) {
  const router = useRouter();
  const fields = useEditorFields({
    title: devLog?.title ?? "",
    content: devLog?.content ?? "",
    thumbnailUrl: devLog?.thumbnailUrl ?? null,
    tagIds: devLog?.tags.map((tag) => tag.id) ?? [],
  });
  const [githubUrl, setGithubUrl] = useState(devLog?.githubUrl ?? "");
  const leaveHref = devLog ? (cancelHref ?? "/dev-logs") : "/";
  const dirty = fields.dirty || githubUrl !== (devLog?.githubUrl ?? "");

  /** 결과를 화면에 반영한다 */
  function handleResult(result: Awaited<ReturnType<typeof createDevLog>>) {
    if (result.ok) {
      toast.success(
        devLog ? "개발 일기가 수정되었습니다" : "개발 일기가 저장되었습니다",
      );
      router.push(
        (devLog ? leaveHref : `/dev-logs/${result.data.id}`) as Route,
      );
      return;
    }
    if (result.error.code === "notFound") {
      toast.error("개발 일기를 찾을 수 없습니다");
      router.push("/dev-logs");
      return;
    }
    fields.setFieldErrors(result.error.fieldErrors ?? {});
    if (!result.error.fieldErrors) toast.error(SAVE_FAILED_MESSAGE);
  }

  /** 검증 → 더미 저장 → 결과 분기 */
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = devLogFormSchema.safeParse({
      title: fields.title,
      content: fields.content,
      thumbnailUrl: fields.savedThumbnailUrl,
      githubUrl,
      tagIds: fields.tagIds,
    });
    if (!parsed.success) {
      fields.setFieldErrors(zodErrorToFieldErrors(parsed.error));
      return;
    }
    fields.setFieldErrors({});
    fields.setSubmitting(true);
    const result = devLog
      ? await updateDevLog({ id: devLog.id, ...parsed.data })
      : await createDevLog(parsed.data);
    fields.setSubmitting(false);
    handleResult(result);
  }

  return {
    fields,
    githubUrl,
    setGithubUrl,
    handleSubmit,
    handleCancel: () => {
      if (dirty) fields.setLeaveOpen(true);
      else router.push(leaveHref as Route);
    },
    leave: () => router.push(leaveHref as Route),
  };
}

/**
 * 개발 일기 게시·수정 폼. 게시글 폼과 달리 slug가 없고 GitHub URL(선택)이 있다.
 * 수정 모드는 상세가 이미 조회한 값으로 시작하고, 변경이 있을 때만 이탈을 확인한다.
 * @param tags 태그 선택 후보
 * @param devLog 수정할 개발 일기 (없으면 게시)
 * @param cancelHref 수정 모드의 [취소] 이동 주소
 */
export function DevLogForm(props: DevLogFormProps) {
  const form = useDevLogForm(props);
  const { fields } = form;
  const editing = Boolean(props.devLog);

  return (
    <EditorFormFrame
      heading={editing ? "개발 일기 수정" : "개발 일기 게시"}
      submitLabel={editing ? "저장" : "게시"}
      submitting={fields.submitting}
      submitDisabled={!fields.filled}
      leaveOpen={fields.leaveOpen}
      onLeaveOpenChange={fields.setLeaveOpen}
      onSubmit={form.handleSubmit}
      onCancel={form.handleCancel}
      onLeave={form.leave}
    >
      <EditorFields
        fields={fields}
        tags={props.tags}
        afterTags={
          <FormField
            id="dev-log-github-url"
            label="GitHub URL (선택)"
            hint="https://github.com/ 로 시작하는 주소"
            value={form.githubUrl}
            disabled={fields.submitting}
            error={fields.fieldErrors.githubUrl}
            onChange={(event) => form.setGithubUrl(event.target.value)}
          />
        }
      />
    </EditorFormFrame>
  );
}
