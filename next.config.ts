import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 상위 폴더의 lockfile을 프로젝트 루트로 오인하지 않도록 명시한다.
  turbopack: {
    root: __dirname,
  },
  // Link href 등 라우트 경로를 타입으로 검증한다.
  typedRoutes: true,
  // 기존 글 목록(/posts)은 메인(/)으로 통합됐다. 안정화 전까지는 307(임시)로 두고 이후 308로 전환한다.
  async redirects() {
    return [{ source: "/posts", destination: "/", permanent: false }];
  },
};

export default nextConfig;
