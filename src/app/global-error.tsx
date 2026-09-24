"use client";

import "./globals.css";

/**
 * 루트 레이아웃에서 발생한 오류를 처리하는 최후의 오류 페이지.
 * 루트 레이아웃을 대체하므로 html, body를 직접 렌더링하며 테마 전환은 적용되지 않는다.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="ko">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <title>문제가 발생했습니다</title>
        <h1 className="text-3xl font-bold tracking-tight">
          문제가 발생했습니다
        </h1>
        {error.digest && (
          <p className="text-xs text-muted-foreground">
            오류 코드: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
