"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { DeleteButton, type DeleteKind } from "@/components/delete-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * 상세 맨 아래 관리자 버튼 줄. [수정] 링크와 [삭제] 버튼을 함께 둔다.
 * 삭제가 진행되는 동안에는 [수정]도 눌리지 않게 비활성화한다.
 * 방문자에게는 서버에서 아예 렌더하지 않으므로 이 컴포넌트는 관리자 상태에서만 쓴다.
 * @param kind 삭제할 대상 종류 (게시글 또는 개발 일기)
 * @param id 삭제할 대상의 id
 * @param editHref [수정] 링크 (같은 URL에 edit=1을 붙인 주소)
 * @param showDelete false면 [삭제]를 그리지 않는다 (삭제가 아직 더미인 화면에서 [수정]만 열 때 사용, 기본 true)
 */
export function AdminActions({
  kind,
  id,
  editHref,
  showDelete = true,
}: {
  kind: DeleteKind;
  id: string;
  editHref: string;
  showDelete?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const editClass = buttonVariants({ variant: "outline" });

  return (
    <div className="flex justify-end gap-2 border-t border-border pt-6">
      {pending ? (
        <span
          aria-disabled="true"
          className={cn(editClass, "pointer-events-none opacity-50")}
        >
          수정
        </span>
      ) : (
        // typedRoutes는 문자열 변수 href에 Route 캐스팅을 요구한다
        <Link href={editHref as Route} className={editClass}>
          수정
        </Link>
      )}
      {showDelete && (
        <DeleteButton kind={kind} id={id} onPendingChange={setPending} />
      )}
    </div>
  );
}
