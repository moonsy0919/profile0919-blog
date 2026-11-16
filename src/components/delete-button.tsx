"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteDevLog, deletePost } from "@/lib/data/actions";

export type DeleteKind = "post" | "devLog";

/** 종류별 다이얼로그 문구·삭제 액션·이동 경로 (PRD 4.1) */
const KIND_CONFIG = {
  post: {
    title: "글을 삭제할까요?",
    description: "삭제한 글은 되돌릴 수 없습니다.",
    successMessage: "글이 삭제되었습니다",
    listHref: "/",
    remove: deletePost,
  },
  devLog: {
    title: "개발 일기를 삭제할까요?",
    description: "삭제한 개발 일기는 되돌릴 수 없습니다.",
    successMessage: "개발 일기가 삭제되었습니다",
    listHref: "/dev-logs",
    remove: deleteDevLog,
  },
} as const;

const FAILURE_MESSAGE = "삭제하지 못했습니다. 다시 시도해 주세요";

type DeleteButtonProps = {
  kind: DeleteKind;
  id: string;
  /** 삭제 진행 여부가 바뀔 때 알린다 (같은 줄의 [수정] 등을 함께 비활성화할 때 사용) */
  onPendingChange?: (pending: boolean) => void;
};

/**
 * 삭제 결과에 따라 토스트를 띄우고 이동 경로를 돌려준다.
 * 성공·이미 삭제됨은 목록 경로를, 실패는 null(상세에 머무름)을 돌려준다.
 * @param config 종류별 설정
 * @param result 삭제 액션의 반환값
 */
function notifyResult(
  config: (typeof KIND_CONFIG)[DeleteKind],
  result: Awaited<ReturnType<(typeof KIND_CONFIG)[DeleteKind]["remove"]>>,
): string | null {
  if (result.ok) {
    toast.success(config.successMessage);
    return config.listHref;
  }
  if (result.error.code === "notFound") {
    toast.info(result.error.message);
    return config.listHref;
  }
  toast.error(FAILURE_MESSAGE);
  return null;
}

/** 삭제 실행 상태와 핸들러를 관리한다 */
function useDeleteAction({ kind, id, onPendingChange }: DeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const config = KIND_CONFIG[kind];

  /** 진행 중에는 다이얼로그를 닫지 못하게 막는다 */
  function handleOpenChange(next: boolean) {
    if (!pending) setOpen(next);
  }

  /** 삭제 액션을 호출하고 다이얼로그를 닫은 뒤 결과를 처리한다 */
  async function handleDelete() {
    setPending(true);
    onPendingChange?.(true);
    const result = await config.remove(id);
    setPending(false);
    onPendingChange?.(false);
    setOpen(false);
    const href = notifyResult(config, result);
    if (href) router.push(href as Route);
  }

  return { open, pending, config, handleOpenChange, handleDelete };
}

/**
 * 관리자용 [삭제] 버튼과 확인 다이얼로그.
 * 진행 중에는 [삭제] 버튼과 다이얼로그의 두 버튼이 모두 비활성화된다.
 */
export function DeleteButton(props: DeleteButtonProps) {
  const { open, pending, config, handleOpenChange, handleDelete } =
    useDeleteAction(props);

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        disabled={pending}
        onClick={() => handleOpenChange(true)}
      >
        삭제
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{config.title}</DialogTitle>
            <DialogDescription>{config.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => handleOpenChange(false)}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={handleDelete}
            >
              {pending ? "삭제 중…" : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
