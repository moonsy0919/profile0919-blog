import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

type HeaderActionsProps = {
  isAdmin: boolean;
  /** 방문자에게 [로그인]을 보일지. /login이 닫혀 있는 동안(프로덕션)은 false */
  showLogin: boolean;
};

/**
 * 헤더 우측 버튼 영역. 서버에서 관리자 여부로 분기해, 방문자 HTML에는 관리 버튼 자체가 포함되지 않는다.
 * [로그아웃]은 인증 연동(Task 016) 전까지 비활성 자리 표시다.
 */
export function HeaderActions({ isAdmin, showLogin }: HeaderActionsProps) {
  if (!isAdmin) {
    if (!showLogin) return null;
    return (
      <Link href="/login" className={buttonVariants({ variant: "outline" })}>
        로그인
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/posts/new" className={buttonVariants({ size: "sm" })}>
        작성
      </Link>
      <Link
        href="/profile/edit"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        프로필
      </Link>
      <Button variant="ghost" size="sm" disabled>
        로그아웃
      </Button>
    </div>
  );
}
