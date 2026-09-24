"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * 라우트 세그먼트에서 예기치 않은 오류가 발생했을 때 표시되는 페이지.
 * retry()로 해당 세그먼트를 다시 불러와 복구를 시도한다.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // 오류 수집 서비스(Sentry 등)를 연동한다면 이곳에서 전송한다.
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tight">문제가 발생했습니다</h1>
      <p className="text-muted-foreground">
        잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground">
          오류 코드: {error.digest}
        </p>
      )}
      <Button size="lg" onClick={() => retry()}>
        다시 시도
      </Button>
    </div>
  );
}
