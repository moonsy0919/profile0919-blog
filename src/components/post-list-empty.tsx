import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/**
 * 게시글 목록의 빈 상태. 태그 필터 결과가 없으면(없는 태그 포함) 안내와 [전체 보기]를,
 * 필터 없이 글이 하나도 없으면 별도 문구를 보여준다.
 * @param tag 현재 선택된 태그 (없으면 전체 보기)
 */
export function PostListEmpty({ tag }: { tag?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border px-4 py-12 text-center">
      <p className="text-muted-foreground">
        {tag ? "해당 태그의 글이 없습니다" : "아직 작성된 글이 없습니다"}
      </p>
      {tag && (
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          전체 보기
        </Link>
      )}
    </div>
  );
}
