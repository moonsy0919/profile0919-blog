"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AVATAR_ACCEPT_TYPES } from "@/lib/validation/constants";

type ProfileAvatarFieldProps = {
  /** 미리보기로 보일 이미지 주소 */
  src: string;
  /** 이미지 선검증 오류 문구 */
  error: string | null;
  /** 제거 버튼을 보일지 (기본 이미지가 보일 때는 숨긴다) */
  removable: boolean;
  disabled?: boolean;
  onSelect: (file: File) => void;
  onRemove: () => void;
};

/**
 * 프로필 이미지 미리보기와 선택·제거 컨트롤.
 * 큰 원형 미리보기를 가운데에 두고, 그 아래에 안내·선택·제거를 차례로 놓는다.
 * 같은 파일을 다시 골라도 change가 일어나도록 선택 직후 input 값을 비운다.
 */
export function ProfileAvatarField({
  src,
  error,
  removable,
  disabled,
  onSelect,
  onRemove,
}: ProfileAvatarFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="profile-avatar">프로필 이미지</Label>
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6">
        <Image
          src={src}
          alt="프로필 이미지 미리보기"
          width={112}
          height={112}
          unoptimized
          className="size-28 shrink-0 rounded-full border-2 border-background object-cover shadow-sm ring-1 ring-border"
        />
        <div className="flex flex-wrap items-center justify-center gap-2">
          <input
            id="profile-avatar"
            type="file"
            accept={AVATAR_ACCEPT_TYPES.join(",")}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error
                ? "profile-avatar-hint profile-avatar-error"
                : "profile-avatar-hint"
            }
            className="w-full min-w-0 text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium sm:w-auto"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (file) onSelect(file);
            }}
          />
          {removable ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={onRemove}
            >
              이미지 제거
            </Button>
          ) : null}
        </div>
        <p id="profile-avatar-hint" className="text-xs text-muted-foreground">
          PNG, JPG, GIF, WEBP · 최대 5MB
        </p>
      </div>
      {error ? (
        <p
          id="profile-avatar-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
