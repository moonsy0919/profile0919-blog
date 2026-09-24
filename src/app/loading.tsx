import { Loader2 } from "lucide-react";

/** 라우트 콘텐츠가 스트리밍되는 동안 표시되는 로딩 UI */
export default function Loading() {
  return (
    <div
      role="status"
      className="container mx-auto flex max-w-5xl items-center justify-center gap-2 px-4 py-24 text-muted-foreground"
    >
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span>불러오는 중...</span>
    </div>
  );
}
