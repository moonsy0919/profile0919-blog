import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormFieldProps = Omit<ComponentProps<typeof Input>, "id"> & {
  /** 입력과 라벨을 잇는 id (오류 문구 id의 바탕이 된다) */
  id: string;
  /** 화면에 보이는 라벨 */
  label: string;
  /** 입력 아래에 보이는 보조 설명 (선택) */
  hint?: string;
  /** 필드 오류 문구. 있으면 aria-invalid와 오류 문구가 켜진다 */
  error?: string;
};

/**
 * 라벨 + 입력 + 오류 문구 묶음. 로그인·프로필 폼이 공유한다.
 * 오류가 있으면 입력에 aria-invalid·aria-describedby를 달아 스크린리더가 문구를 읽게 한다.
 * @param id 입력 id
 * @param label 라벨 문구
 * @param hint 보조 설명 (없으면 표시하지 않음)
 * @param error 필드 오류 문구 (없으면 표시하지 않음)
 */
export function FormField({
  id,
  label,
  hint,
  error,
  ...inputProps
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
