"use client";

import Image from "next/image";
import { useState } from "react";
import { DEFAULT_THUMBNAIL } from "@/components/thumbnail-image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AVATAR_ACCEPT_TYPES } from "@/lib/validation/constants";

type ThumbnailFieldProps = {
  /** 미리보기로 보일 이미지 주소 (없으면 빈 자리) */
  src: string | null;
  /** 이미지 선검증 오류 문구 */
  error: string | null;
  /** 저장 중 Storage로 올리는 중인지 (안내 문구 표시) */
  uploading?: boolean;
  disabled?: boolean;
  onSelect: (file: File) => void;
  onRemove: () => void;
};

/**
 * 썸네일(16:9) 미리보기와 선택·제거 컨트롤.
 * 이 컴포넌트는 로컬 미리보기·선택·제거와 업로드 상태 표시만 맡는다(업로드는 [저장] 시점에 폼이 수행).
 * 같은 파일을 다시 골라도 change가 일어나도록 선택 직후 input 값을 비운다.
 */
export function ThumbnailField({
  src,
  error,
  uploading,
  disabled,
  onSelect,
  onRemove,
}: ThumbnailFieldProps) {
  // 불러오지 못한 주소는 기본 이미지로 바꿔 깨진 이미지가 보이지 않게 한다
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="thumbnail-file">썸네일</Label>
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-dashed border-border bg-muted/30">
        {src ? (
          <Image
            src={failedSrc === src ? DEFAULT_THUMBNAIL : src}
            alt="썸네일 미리보기"
            fill
            unoptimized
            className="object-cover"
            onError={() => setFailedSrc(src)}
          />
        ) : (
          <p className="flex size-full items-center justify-center text-sm text-muted-foreground">
            없으면 기본 이미지가 쓰입니다
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          id="thumbnail-file"
          type="file"
          accept={AVATAR_ACCEPT_TYPES.join(",")}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error
              ? "thumbnail-file-hint thumbnail-file-error"
              : "thumbnail-file-hint"
          }
          className="w-full min-w-0 text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium sm:w-auto"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) onSelect(file);
          }}
        />
        {src ? (
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
      <p id="thumbnail-file-hint" className="text-xs text-muted-foreground">
        PNG, JPG, GIF, WEBP · 최대 5MB
      </p>
      {uploading ? (
        <p role="status" className="text-sm text-muted-foreground">
          이미지를 올리는 중입니다…
        </p>
      ) : null}
      {error ? (
        <p
          id="thumbnail-file-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
