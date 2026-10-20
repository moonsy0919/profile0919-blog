import Link from "next/link";
import { ON_SKY_BUTTON } from "@/components/on-sky";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HeaderActionsProps = {
  isAdmin: boolean;
  /** 방문자에게 [로그인]을 보일지. /login이 닫혀 있는 동안(프로덕션)은 false */
  showLogin: boolean;
  /** 하늘(확장형 헤더) 위에 얹는 스타일로 그릴지 */
  onSky?: boolean;
};

/**
 * 헤더 우측 버튼 영역. 서버에서 관리자 여부로 분기해, 방문자 HTML에는 관리 버튼 자체가 포함되지 않는다.
 * [로그아웃]은 인증 연동(Task 016) 전까지 비활성 자리 표시다.
 */
export function HeaderActions({
  isAdmin,
  showLogin,
  onSky = false,
}: HeaderActionsProps) {
  const sky = onSky ? ON_SKY_BUTTON : "";
  if (!isAdmin) {
    if (!showLogin) return null;
    return (
      <Link
        href="/login"
        className={buttonVariants({ variant: "outline", className: sky })}
      >
        로그인
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/posts/new"
        className={buttonVariants({
          size: "sm",
          className: cn(onSky && ON_SKY_BUTTON),
        })}
      >
        작성
      </Link>
      <Link
        href="/profile/edit"
        className={buttonVariants({
          variant: "outline",
          size: "sm",
          className: sky,
        })}
      >
        프로필
      </Link>
      <Button
        variant="ghost"
        size="sm"
        disabled
        className={onSky ? "text-white" : undefined}
      >
        로그아웃
      </Button>
    </div>
  );
}
