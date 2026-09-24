import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "소개",
  description: "Next.js 스타터킷 소개",
};

/** 스타터킷 소개 페이지 */
export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">소개</h1>
      <p className="mt-4 text-muted-foreground">
        이 프로젝트는 Next.js, TypeScript, TailwindCSS v4, shadcn/ui를 바탕으로
        새 프로젝트를 빠르게 시작할 수 있도록 만든 스타터킷입니다.
      </p>
    </div>
  );
}
