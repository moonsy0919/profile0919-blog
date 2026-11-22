"use client";

import { useState } from "react";
import { useImagePicker } from "@/lib/use-image-picker";
import { useUnsavedChanges } from "@/lib/use-unsaved-changes";

/** 게시글·개발 일기 폼이 공유하는 필드의 초기값 */
export type EditorInitial = {
  title: string;
  content: string;
  thumbnailUrl: string | null;
  tagIds: string[];
};

/** 저장 실패 시 공통으로 보이는 토스트 문구 */
export const SAVE_FAILED_MESSAGE = "저장하지 못했습니다. 다시 시도해 주세요";

/**
 * 태그 id 목록이 같은지 비교한다. 선택 순서는 무시한다.
 * @param a 비교할 목록
 * @param b 비교할 목록
 */
function sameIds(a: string[], b: string[]) {
  return [...a].sort().join("\n") === [...b].sort().join("\n");
}

/**
 * 게시글·개발 일기 폼의 공통 필드 상태를 관리한다.
 * 제목·본문·태그·썸네일 선택, 변경 여부(dirty), 제출·이탈 확인 상태를 한곳에서 다룬다.
 * 썸네일은 고른 File을 보관하고, 업로드는 [저장] 시점에 폼이 수행한다(업로드 중 상태·오류는 여기서 관리).
 * @param initial 작성은 빈 값, 수정은 상세가 이미 조회한 값
 */
export function useEditorFields(initial: EditorInitial) {
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [tagIds, setTagIds] = useState(initial.tagIds);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const thumbnail = useImagePicker();

  const dirty =
    title !== initial.title ||
    content !== initial.content ||
    !sameIds(tagIds, initial.tagIds) ||
    thumbnail.changed;
  useUnsavedChanges(dirty);

  const savedThumbnailUrl = thumbnail.removed ? null : initial.thumbnailUrl;
  const filled = title.trim().length > 0 && content.trim().length > 0;
  return {
    title,
    setTitle,
    content,
    setContent,
    tagIds,
    setTagIds,
    fieldErrors,
    setFieldErrors,
    submitting,
    setSubmitting,
    leaveOpen,
    setLeaveOpen,
    thumbnail,
    uploading,
    setUploading,
    uploadError,
    setUploadError,
    /** 새 파일을 고른다. 이전 업로드 실패 문구는 지운다 */
    selectThumbnail: (file: File) => {
      setUploadError(null);
      thumbnail.select(file);
    },
    /** 썸네일을 제거한다. 이전 업로드 실패 문구는 지운다 */
    removeThumbnail: () => {
      setUploadError(null);
      thumbnail.remove();
    },
    dirty,
    savedThumbnailUrl,
    shownThumbnail: thumbnail.previewUrl ?? savedThumbnailUrl,
    /** 제목·본문이 모두 채워졌는지 */
    filled,
    /** [저장] 비활성 조건: 제목·본문이 비었거나 이미지 업로드 중 (PRD 4.4) */
    submitBlocked: !filled || uploading,
  };
}
