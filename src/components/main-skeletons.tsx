/** 스켈레톤 블록 하나. 로딩 중임을 스크린 리더에 알리지 않도록 장식으로만 쓴다 */
function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

/** 게시글 영역 로딩 자리: 사이드바 줄 몇 개와 카드 4장 */
export function PostListSkeleton() {
  return (
    <div
      role="status"
      aria-label="게시글 불러오는 중"
      className="grid grid-cols-[minmax(0,1fr)] gap-6 sm:grid-cols-[12rem_minmax(0,1fr)]"
    >
      <div className="flex gap-2 sm:flex-col">
        {Array.from({ length: 4 }, (_, i) => (
          <Block key={i} className="h-8 w-24 sm:w-full" />
        ))}
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Block key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}

/** 개발 일기 영역 로딩 자리: 제목 줄과 카드 4장 */
export function DevLogSkeleton() {
  return (
    <div
      role="status"
      aria-label="개발 일기 불러오는 중"
      className="flex flex-col gap-4"
    >
      <Block className="h-7 w-28" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Block key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}
