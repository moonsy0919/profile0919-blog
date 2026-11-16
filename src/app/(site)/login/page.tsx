import type { Metadata } from "next";
import { FormCardPage } from "@/components/form-card-page";
import { LoginForm } from "@/components/login-form";
import { assertDevOnly } from "@/lib/dev-gate";
import type { RawSearchParams } from "@/lib/list-state";

type LoginPageProps = { searchParams: Promise<RawSearchParams> };

export const metadata: Metadata = {
  title: "로그인",
  robots: { index: false },
};

/**
 * 관리자 로그인(/login). 사이트맵에는 포함하지 않는다.
 * next 쿼리가 있으면 관리자 전용 페이지에서 넘어온 것이므로 안내 문구를 보인다.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  assertDevOnly();
  const { next } = await searchParams;
  return (
    <FormCardPage title="로그인">
      <LoginForm needsLogin={Boolean(next)} />
    </FormCardPage>
  );
}
