"use client";

import { useEffect, useRef, useState } from "react";
import { validateAvatarFile } from "@/lib/validation/avatar";

/** 이미지 선택 상태 */
type ImagePickerState = {
  /** 새로 고른 이미지 파일. [저장] 시점에 Storage로 올린다 (없으면 null) */
  file: File | null;
  /** 새로 고른 이미지의 로컬 미리보기 주소 (없으면 null) */
  previewUrl: string | null;
  /** 기존 이미지를 제거했는지 */
  removed: boolean;
  /** 선검증 오류 문구 */
  error: string | null;
};

const INITIAL_STATE: ImagePickerState = {
  file: null,
  previewUrl: null,
  removed: false,
  error: null,
};

/**
 * 이미지(프로필·썸네일) 선택·제거와 로컬 미리보기를 관리한다.
 * 고른 파일은 형식·용량을 먼저 검증하고 File을 보관하며, 미리보기 주소는 교체·언마운트 때 해제한다.
 * 선택 즉시 올리지 않는다: 업로드는 [저장] 시점에 호출한 쪽(saveWithImage)이 보관된 file로 수행한다.
 */
export function useImagePicker() {
  const [state, setState] = useState<ImagePickerState>(INITIAL_STATE);
  const urlRef = useRef<string | null>(null);

  useEffect(() => () => revokeUrl(urlRef.current), []);

  /** 파일을 검증하고 통과하면 미리보기를 바꾼다. 실패하면 이전 선택을 유지한다 */
  function select(file: File) {
    const error = validateAvatarFile(file);
    if (error) {
      setState((prev) => ({ ...prev, error }));
      return;
    }
    revokeUrl(urlRef.current);
    urlRef.current = URL.createObjectURL(file);
    setState({
      file,
      previewUrl: urlRef.current,
      removed: false,
      error: null,
    });
  }

  /** 이미지를 제거한다. 표시는 기본 이미지로 폴백된다 */
  function remove() {
    revokeUrl(urlRef.current);
    urlRef.current = null;
    setState({ file: null, previewUrl: null, removed: true, error: null });
  }

  const changed = state.previewUrl !== null || state.removed;
  return { ...state, changed, select, remove };
}

/** 로컬 미리보기 주소를 해제한다 */
function revokeUrl(url: string | null) {
  if (url) URL.revokeObjectURL(url);
}
