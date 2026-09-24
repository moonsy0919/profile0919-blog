import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "문서",
  description: "Next.js 스타터킷 사용 가이드",
};

/** 스타터킷 사용 가이드 페이지 */
export default function DocsPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">문서</h1>
      <p className="mt-4 text-muted-foreground">
        프로젝트 구조와 사용법은 저장소의 README.md를 참고하세요.
      </p>
    </div>
  );
}
