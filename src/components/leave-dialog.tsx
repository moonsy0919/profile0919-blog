"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LeaveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** [나가기]를 눌렀을 때 실제 이동을 맡는 콜백 */
  onLeave: () => void;
};

/**
 * 저장하지 않고 나갈지 묻는 확인 다이얼로그. 프로필·게시글·개발 일기 폼이 공유한다.
 * @param open 열림 여부
 * @param onOpenChange 열림 상태 변경 콜백
 * @param onLeave [나가기] 클릭 콜백
 */
export function LeaveDialog({ open, onOpenChange, onLeave }: LeaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>저장하지 않고 나갈까요?</DialogTitle>
          <DialogDescription>
            변경한 내용은 저장되지 않습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            계속 수정
          </Button>
          <Button type="button" variant="destructive" onClick={onLeave}>
            나가기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
