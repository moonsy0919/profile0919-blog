import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DevLogDetail } from "@/components/dev-log-detail";
import { DevLogForm } from "@/components/dev-log-form";
import { getDevLog, getTags, getViewer } from "@/lib/data";
import { requireAdmin } from "@/lib/auth/require-admin";
import { assertDevOnly, isDevOnlyOpen } from "@/lib/dev-gate";
import {
  buildDetailMetadata,
  isEditMode,
  isEditRequested,
} from "@/lib/edit-mode";
import {
  buildBackHref,
  buildEditHref,
  type RawSearchParams,
} from "@/lib/list-state";

type DevLogDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<RawSearchParams>;
};

/** 개발 일기는 태그 필터가 없어 [목록으로]·[수정]·[취소] 링크에 page만 전달한다 */
const LINK_OPTIONS = { includeTag: false };

/**
 * 문서 제목과 색인 여부를 정한다. edit=1이 붙은 주소는 noindex다.
 * 수정 모드(edit=1)는 더미 액션을 쓰므로 프로덕션에서는 게이트로 404 처리한다.
 */
export async function generateMetadata({
  params,
  searchParams,
}: DevLogDetailPageProps): Promise<Metadata> {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (isEditRequested(sp)) assertDevOnly();
  const devLog = await getDevLog(id);
  return devLog ? buildDetailMetadata(devLog.title, sp) : {};
}

/**
 * 개발 일기 상세(/dev-logs/[id]). 관리자가 edit=1로 들어오면 같은 URL에서 수정 모드로 바뀐다.
 * 읽기 모드는 실데이터라 프로덕션에도 열려 있다. 수정 모드(edit=1)와 관리자 [수정]·[삭제]는
 * 더미 액션을 쓰므로 Task 022에서 실연동하기 전까지 개발 환경에서만 연다.
 * 게이트와 notFound()는 Suspense 바깥에서 불러야 HTTP 404가 된다.
 */
export default async function DevLogDetailPage({
  params,
  searchParams,
}: DevLogDetailPageProps) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (isEditRequested(sp)) assertDevOnly();
  const devLog = await getDevLog(id);
  if (!devLog) notFound();
  const detailPath = `/dev-logs/${devLog.id}`;
  const editHref = buildEditHref(detailPath, sp, LINK_OPTIONS);
  // 비관리자의 edit=1은 로그인으로 보내고, 로그인하면 같은 수정 모드(edit=1·page 유지)로 돌아온다
  if (isEditRequested(sp)) await requireAdmin(editHref);
  const viewer = await getViewer();

  // 수정 모드는 서버에서 분기해 읽기 뷰의 버튼·링크가 DOM에 남지 않게 한다
  if (isEditMode(sp, viewer)) {
    const tags = await getTags();
    return (
      <DevLogForm
        tags={tags}
        devLog={devLog}
        cancelHref={buildBackHref(detailPath, sp, LINK_OPTIONS)}
      />
    );
  }

  return (
    <DevLogDetail
      devLog={devLog}
      backHref={buildBackHref("/dev-logs", sp, LINK_OPTIONS)}
      isAdmin={viewer.isAdmin && isDevOnlyOpen()}
      editHref={editHref}
    />
  );
}
