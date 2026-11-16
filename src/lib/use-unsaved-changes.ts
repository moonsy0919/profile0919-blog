"use client";

import { useEffect } from "react";

/**
 * 저장하지 않은 변경이 있을 때 새로고침·탭 닫기를 브라우저 기본 확인창으로 막는다.
 * 앱 안의 [취소] 이동 확인은 각 폼이 다이얼로그로 따로 처리한다.
 * @param dirty 저장하지 않은 변경이 있는지 여부
 */
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);
}
