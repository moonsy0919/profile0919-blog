import pkg from "../../package.json";

/**
 * 사이트 배포 주소를 결정한다.
 * 우선순위: NEXT_PUBLIC_SITE_URL → Vercel 프로덕션 도메인 → 로컬 주소.
 * 환경 변수가 빈 문자열로 등록된 경우에도 폴백이 적용되도록 `||`를 사용한다.
 * @returns 끝의 슬래시가 없는 사이트 주소
 */
function getSiteUrl(): string {
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const url =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (vercelHost ? `https://${vercelHost}` : "") ||
    "http://localhost:3000";

  return url.replace(/\/+$/, "");
}

/**
 * 사이트 전역 설정. 이름, 설명, 버전, 네비게이션 등 여러 곳에서 쓰는 값의 단일 출처.
 */
export const siteConfig = {
  name: "Next.js Starter Kit",
  description: "Next.js, TypeScript, TailwindCSS v4, shadcn/ui 기반의 스타터킷",
  /** 배포 주소. 메타데이터, sitemap, robots에서 사용하며 NEXT_PUBLIC_SITE_URL로 직접 지정할 수 있다. */
  url: getSiteUrl(),
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
