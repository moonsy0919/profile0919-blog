"use client";

import type { ReactNode } from "react";
import { FormField } from "@/components/form-field";
import { MarkdownEditor } from "@/components/markdown-editor";
import { TagPicker } from "@/components/tag-picker";
import { ThumbnailField } from "@/components/thumbnail-field";
import type { Tag } from "@/lib/data";
import type { useEditorFields } from "@/lib/use-editor-fields";
import { TITLE_MAX } from "@/lib/validation/constants";

type EditorFieldsProps = {
  /** useEditorFields가 돌려준 공통 필드 상태 */
  fields: ReturnType<typeof useEditorFields>;
  /** 태그 선택 후보 */
  tags: Tag[];
  /** 제목 바로 아래에 끼워 넣는 필드 (게시글의 slug) */
  afterTitle?: ReactNode;
  /** 태그 아래에 끼워 넣는 필드 (개발 일기의 GitHub URL) */
  afterTags?: ReactNode;
  /** 제목이 바뀔 때 부르는 추가 동작 (slug 자동 제안) */
  onTitleChange?: (title: string) => void;
};

/**
 * 게시글·개발 일기 폼이 공유하는 입력 필드 묶음: 썸네일·제목·본문·태그.
 * 폼별 필드는 afterTitle·afterTags 자리에 끼워 넣는다.
 */
export function EditorFields({
  fields,
  tags,
  afterTitle,
  afterTags,
  onTitleChange,
}: EditorFieldsProps) {
  const { fieldErrors, submitting, thumbnail } = fields;
  return (
    <>
      <ThumbnailField
        src={fields.shownThumbnail}
        error={thumbnail.error ?? fieldErrors.thumbnailUrl ?? null}
        disabled={submitting}
        onSelect={thumbnail.select}
        onRemove={thumbnail.remove}
      />
      <FormField
        id="editor-title"
        label="제목"
        hint={`${TITLE_MAX}자 이하`}
        value={fields.title}
        disabled={submitting}
        error={fieldErrors.title}
        onChange={(event) => {
          fields.setTitle(event.target.value);
          onTitleChange?.(event.target.value);
        }}
      />
      {afterTitle}
      <MarkdownEditor
        id="editor-content"
        value={fields.content}
        onChange={fields.setContent}
        error={fieldErrors.content}
        disabled={submitting}
      />
      <TagPicker
        tags={tags}
        selectedIds={fields.tagIds}
        onChange={fields.setTagIds}
        error={fieldErrors.tagIds}
        disabled={submitting}
      />
      {afterTags}
    </>
  );
}
