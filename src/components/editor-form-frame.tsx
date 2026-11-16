"use client";

import type { FormEvent, ReactNode } from "react";
import { LeaveDialog } from "@/components/leave-dialog";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";

type EditorFormFrameProps = {
  /** 화면 제목 (예: 게시글 작성) */
  heading: string;
  /** 저장 버튼 문구 (예: 저장, 게시) */
  submitLabel: string;
  submitting: boolean;
  /** 제목·본문이 비었을 때 [저장]을 막는다 */
  submitDisabled: boolean;
  leaveOpen: boolean;
  onLeaveOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
  onLeave: () => void;
  children: ReactNode;
};

/**
 * 작성·수정 폼 공통 틀. 상세(읽기 뷰)와 같은 컨테이너 폭(max-w-5xl 안 max-w-3xl)·여백을 써서
 * 같은 페이지가 읽기에서 수정으로 바뀐 느낌이 나게 한다. [취소]·[저장] 줄과 이탈 확인을 포함한다.
 * @param heading 화면 제목
 * @param submitLabel 저장 버튼 문구
 * @param children 폼 필드들
 */
export function EditorFormFrame({
  heading,
  submitLabel,
  submitting,
  submitDisabled,
  leaveOpen,
  onLeaveOpenChange,
  onSubmit,
  onCancel,
  onLeave,
  children,
}: EditorFormFrameProps) {
  return (
    <section
      aria-labelledby="editor-heading"
      className="container mx-auto max-w-5xl px-4 py-8"
    >
      <div className="flex max-w-3xl flex-col gap-6">
        <h1 id="editor-heading" className="text-3xl font-bold">
          {heading}
        </h1>
        <form
          onSubmit={onSubmit}
          noValidate
          aria-busy={submitting}
          className="flex flex-col gap-8"
        >
          {children}
          <div className="flex justify-end gap-2 border-t border-border pt-6">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={onCancel}
            >
              취소
            </Button>
            <SubmitButton
              submitting={submitting}
              pendingLabel="저장 중…"
              disabled={submitDisabled}
            >
              {submitLabel}
            </SubmitButton>
          </div>
        </form>
      </div>
      <LeaveDialog
        open={leaveOpen}
        onOpenChange={onLeaveOpenChange}
        onLeave={onLeave}
      />
    </section>
  );
}
