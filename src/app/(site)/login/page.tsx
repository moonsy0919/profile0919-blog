import type { Metadata, Route } from "next";
import { redirect } from "next/navigation";
import { FormCardPage } from "@/components/form-card-page";
import { LoginForm } from "@/components/login-form";
import { sanitizeNext } from "@/lib/auth/safe-next";
import { getViewer } from "@/lib/data";
import type { RawSearchParams } from "@/lib/list-state";

type LoginPageProps = { searchParams: Promise<RawSearchParams> };

export const metadata: Metadata = {
  title: "로그인",
  robots: { index: false },
};

/**
 * 관리자 로그인(/login). 사이트맵에는 포함하지 않는다.
 * 이미 로그인한 관리자는 next(내부 경로만, 없으면 /)로 보낸다.
 * next 쿼리가 있으면 관리자 전용 페이지에서 넘어온 것이므로 안내 문구를 보인다.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const nextPath = Array.isArray(next) ? next[0] : next;
  const viewer = await getViewer();
  if (viewer.isAdmin) redirect(sanitizeNext(nextPath) as Route);

  return (
    <FormCardPage title="로그인">
      <LoginForm needsLogin={Boolean(nextPath)} next={nextPath} />
    </FormCardPage>
  );
}
