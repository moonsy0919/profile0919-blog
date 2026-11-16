import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { AdminActions } from "@/components/admin-actions";
import { MarkdownContent } from "@/components/markdown-content";
import { ThumbnailImage } from "@/components/thumbnail-image";
import { Badge } from "@/components/ui/badge";
import type { DevLog } from "@/lib/data";
import { formatPostDate } from "@/lib/format-date";

type DevLogDetailProps = {
  devLog: DevLog;
  /** 상단 [목록으로] 링크 (진입 때 전달된 page를 복원한 주소) */
  backHref: string;
  /** 관리자일 때만 맨 아래에 [수정]/[삭제]를 그린다 */
  isAdmin: boolean;
  /** 관리자 [수정] 링크 (같은 URL에 edit=1) */
  editHref: string;
};

/**
 * 태그 칩 목록. 개발 일기에는 태그 필터가 없어 표시 전용이다.
 * @param tags 개발 일기의 태그
 */
function DevLogTags({ tags }: { tags: DevLog["tags"] }) {
  if (tags.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1" aria-label="태그">
      {tags.map((tag) => (
        <li key={tag.id}>
          <Badge variant="secondary">{tag.name}</Badge>
        </li>
      ))}
    </ul>
  );
}

/**
 * GitHub 링크. 주소가 있을 때만 새 탭으로 여는 링크를 그린다.
 * @param githubUrl GitHub 저장소 주소 (없으면 null)
 */
function GithubLink({ githubUrl }: { githubUrl: string | null }) {
  if (!githubUrl) return null;
  return (
    <a
      href={githubUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub 저장소 열기"
      className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      GitHub
      <ExternalLink className="size-3.5" aria-hidden="true" />
    </a>
  );
}

/**
 * 개발 일기 상세(읽기 모드). 썸네일은 있을 때만 보여 준다.
 * 관리자 버튼은 서버에서 판정한 isAdmin이 true일 때만 DOM에 생긴다.
 */
export function DevLogDetail({
  devLog,
  backHref,
  isAdmin,
  editHref,
}: DevLogDetailProps) {
  return (
    <article className="container mx-auto max-w-5xl px-4 py-8">
      <div className="flex max-w-3xl flex-col gap-6">
        <Link
          href={backHref as Route}
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          목록으로
        </Link>
        {devLog.thumbnailUrl && (
          <ThumbnailImage src={devLog.thumbnailUrl} className="rounded-lg" />
        )}
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold">{devLog.title}</h1>
          <time
            dateTime={devLog.createdAt}
            className="text-sm text-muted-foreground"
          >
            {formatPostDate(devLog.createdAt)}
          </time>
          <DevLogTags tags={devLog.tags} />
          <GithubLink githubUrl={devLog.githubUrl} />
        </header>
        <MarkdownContent content={devLog.content} />
        {isAdmin && (
          <AdminActions kind="devLog" id={devLog.id} editHref={editHref} />
        )}
      </div>
    </article>
  );
}
