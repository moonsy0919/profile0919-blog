import Link from "next/link";
import { ON_SKY_BUTTON } from "@/components/on-sky";
import { Button, buttonVariants } from "@/components/ui/button";
import { logout } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

type HeaderActionsProps = {
  isAdmin: boolean;
  /** 하늘(확장형 헤더) 위에 얹는 스타일로 그릴지 */
  onSky?: boolean;
};

/**
 * 헤더 우측 버튼 영역. 서버에서 관리자 여부로 분기해, 방문자 HTML에는 관리 버튼 자체가 포함되지 않는다.
 * [로그아웃]은 서버 액션(logout)에 연결된 폼 제출 버튼이다.
 */
export function HeaderActions({ isAdmin, onSky = false }: HeaderActionsProps) {
  const sky = onSky ? ON_SKY_BUTTON : "";
  if (!isAdmin) {
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
      <form action={logout}>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className={onSky ? "text-white" : undefined}
        >
          로그아웃
        </Button>
      </form>
    </div>
  );
}
