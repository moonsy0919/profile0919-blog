import pkg from "../../package.json";

/**
 * 사이트 전역 설정. 이름, 설명, 버전, 네비게이션 등 여러 곳에서 쓰는 값의 단일 출처.
 */
export const siteConfig = {
  name: "Next.js Starter Kit",
  description: "Next.js, TypeScript, TailwindCSS v4, shadcn/ui 기반의 스타터킷",
  /** 배포 주소. 메타데이터, sitemap, robots에서 사용하며 .env.local의 NEXT_PUBLIC_SITE_URL로 지정한다. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** package.json의 version을 그대로 사용한다. */
  version: `v${pkg.version}`,
  /** 저장소 주소. 비워두면 GitHub 링크가 화면에서 숨겨진다. */
  githubUrl: "",
} as const;

/** 헤더 네비게이션 링크 목록. 새 페이지를 만들면 여기에 추가한다. */
export const NAV_LINKS = [
  { href: "/", label: "홈" },
  { href: "/about", label: "소개" },
  { href: "/docs", label: "문서" },
] as const;
