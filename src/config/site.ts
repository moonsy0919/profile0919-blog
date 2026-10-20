import pkg from "../../package.json";
import { profileConfig } from "./profile";
import { weatherConfig } from "./weather";

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
  name: "profile0919",
  description: "profile0919의 개인 블로그",
  /** 배포 주소. 메타데이터, sitemap, robots에서 사용하며 NEXT_PUBLIC_SITE_URL로 직접 지정할 수 있다. */
  url: getSiteUrl(),
  /** package.json의 version을 그대로 사용한다. */
  version: `v${pkg.version}`,
  /** 저장소 주소. 비워두면 GitHub 링크가 화면에서 숨겨진다. */
  githubUrl: "",
  /** 날씨 헤더의 조회 지점(서울 고정). 클라이언트 코드는 번들 의존을 피하려고 `@/config/weather`를 직접 가져온다. */
  weather: weatherConfig,
  /** 헤더 중앙 프로필의 기본값(이름·이미지). DB 값이 없을 때의 폴백이며 정적 값은 `@/config/profile`에 있다. */
  profile: profileConfig,
} as const;

/**
 * 사이트맵에 포함할 정적 경로. 프로덕션에서 열려 있는 경로만 넣는다.
 * /dev-logs는 더미 게이트가 풀리는 Task 018에서 추가한다. 글 상세 URL은 Task 017에서 DB 기반으로 추가한다.
 */
export const SITEMAP_PATHS = ["/"] as const;
