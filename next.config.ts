import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 상위 폴더의 lockfile을 프로젝트 루트로 오인하지 않도록 명시한다.
  turbopack: {
    root: __dirname,
  },
  // Link href 등 라우트 경로를 타입으로 검증한다.
  typedRoutes: true,
};

export default nextConfig;
