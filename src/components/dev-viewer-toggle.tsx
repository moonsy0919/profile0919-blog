"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DEV_VIEWER_ADMIN, DEV_VIEWER_COOKIE } from "@/lib/dev-viewer";

/**
 * 개발 전용: 방문자/관리자 미리보기를 쿠키로 전환한다. 프로덕션에서는 렌더링되지 않는다.
 * @param isAdmin 현재 관리자 미리보기 여부
 */
export function DevViewerToggle({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();

  /** 쿠키를 바꾸고 서버 컴포넌트를 다시 렌더링한다 */
  function toggle() {
    document.cookie = isAdmin
      ? `${DEV_VIEWER_COOKIE}=; path=/; max-age=0`
      : `${DEV_VIEWER_COOKIE}=${DEV_VIEWER_ADMIN}; path=/`;
    router.refresh();
  }

  return (
    <Button variant="ghost" size="xs" onClick={toggle}>
      {isAdmin ? "[개발] 방문자로 보기" : "[개발] 관리자로 보기"}
    </Button>
  );
}
