import { Loader2Icon } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

/**
 * 제출 버튼. 제출 중이면 비활성이 되고 스피너와 진행 문구를 보여 준다.
 * @param submitting 제출 진행 중 여부
 * @param pendingLabel 제출 중에 보일 문구 (기본값은 원래 문구 유지)
 */
export function SubmitButton({
  submitting,
  pendingLabel,
  children,
  disabled,
  ...props
}: ComponentProps<typeof Button> & {
  submitting: boolean;
  pendingLabel?: string;
}) {
  return (
    <Button type="submit" disabled={disabled || submitting} {...props}>
      {submitting ? <Loader2Icon aria-hidden className="animate-spin" /> : null}
      {submitting && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
