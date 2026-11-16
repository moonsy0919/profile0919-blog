"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { ProfileAvatarField } from "@/components/profile-avatar-field";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { profileConfig } from "@/config/profile";
import type { Profile } from "@/lib/data";
import { updateProfile } from "@/lib/data/actions";
import { useAvatarPicker } from "@/lib/use-avatar-picker";
import { useUnsavedChanges } from "@/lib/use-unsaved-changes";
import { DISPLAY_NAME_MAX } from "@/lib/validation/constants";
import { zodErrorToFieldErrors } from "@/lib/validation/errors";
import { profileFormSchema } from "@/lib/validation/profile";

const SAVE_FAILED_MESSAGE = "저장하지 못했습니다. 다시 시도해 주세요";

/**
 * 프로필 폼의 상태와 동작을 관리한다.
 * 변경 여부(dirty)·이미지 선택·검증·저장·취소 이동을 한곳에서 다룬다.
 * @param initialProfile 서버가 조회한 현재 프로필
 */
function useProfileForm(initialProfile: Profile) {
  const router = useRouter();
  const avatar = useAvatarPicker();
  const [displayName, setDisplayName] = useState(initialProfile.displayName);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const dirty = displayName !== initialProfile.displayName || avatar.changed;
  useUnsavedChanges(dirty);

  const savedAvatarUrl = avatar.removed ? null : initialProfile.avatarUrl;
  const shownAvatar =
    avatar.previewUrl ?? savedAvatarUrl ?? profileConfig.avatarUrl;

  /** 검증 → 더미 저장 → 결과 분기 */
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = profileFormSchema.safeParse({
      displayName,
      avatarUrl: savedAvatarUrl,
    });
    if (!parsed.success) {
      setFieldErrors(zodErrorToFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    const result = await updateProfile(parsed.data);
    setSubmitting(false);
    if (result.ok) {
      toast.success("프로필이 저장되었습니다");
      router.push("/");
      return;
    }
    setFieldErrors(result.error.fieldErrors ?? {});
    if (!result.error.fieldErrors) toast.error(SAVE_FAILED_MESSAGE);
  }

  /** 변경이 없으면 바로, 있으면 확인 후 메인으로 돌아간다 */
  function handleCancel() {
    if (dirty) setLeaveOpen(true);
    else router.push("/");
  }

  return {
    avatar,
    displayName,
    setDisplayName,
    fieldErrors,
    submitting,
    leaveOpen,
    setLeaveOpen,
    shownAvatar,
    removable: avatar.previewUrl !== null || savedAvatarUrl !== null,
    handleSubmit,
    handleCancel,
    leave: () => router.push("/"),
  };
}

/**
 * 프로필 수정 폼. 현재 프로필 값으로 시작하고, 변경이 있을 때만 [취소]·새로고침에서 이탈을 확인한다.
 * 이미지는 로컬 미리보기까지만 다루며 실제 업로드는 Task 023에서 연결한다.
 * @param initialProfile 서버가 조회한 현재 프로필
 */
export function ProfileForm({ initialProfile }: { initialProfile: Profile }) {
  const form = useProfileForm(initialProfile);
  const { avatar, fieldErrors, submitting } = form;

  return (
    <>
      <form
        onSubmit={form.handleSubmit}
        noValidate
        className="flex flex-col gap-8"
      >
        <FormField
          id="profile-display-name"
          label="표시 이름"
          hint={`헤더 중앙에 표시됩니다 (1~${DISPLAY_NAME_MAX}자)`}
          value={form.displayName}
          disabled={submitting}
          error={fieldErrors.displayName}
          onChange={(event) => form.setDisplayName(event.target.value)}
        />
        <ProfileAvatarField
          src={form.shownAvatar}
          error={avatar.error ?? fieldErrors.avatarUrl ?? null}
          removable={form.removable}
          disabled={submitting}
          onSelect={avatar.select}
          onRemove={avatar.remove}
        />
        <ProfileFormActions
          submitting={submitting}
          onCancel={form.handleCancel}
        />
      </form>
      <LeaveDialog
        open={form.leaveOpen}
        onOpenChange={form.setLeaveOpen}
        onLeave={form.leave}
      />
    </>
  );
}

/** [취소]·[저장] 버튼 줄 */
function ProfileFormActions({
  submitting,
  onCancel,
}: {
  submitting: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-border pt-6">
      <Button
        type="button"
        variant="outline"
        disabled={submitting}
        onClick={onCancel}
      >
        취소
      </Button>
      <SubmitButton submitting={submitting} pendingLabel="저장 중…">
        저장
      </SubmitButton>
    </div>
  );
}

/** 저장하지 않고 나갈지 묻는 확인 다이얼로그 */
function LeaveDialog({
  open,
  onOpenChange,
  onLeave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeave: () => void;
}) {
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
