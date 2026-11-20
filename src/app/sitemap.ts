import type { MetadataRoute } from "next";
import { SITEMAP_PATHS, siteConfig } from "@/config/site";
import { getSitemapDevLogs, getSitemapPosts } from "@/lib/data/reads-sitemap";

// 기본값은 빌드 시점에 굳어 새 글이 반영되지 않으므로 요청마다 만든다.
export const dynamic = "force-dynamic";

/**
 * 사이트맵 (/sitemap.xml). SITEMAP_PATHS의 열린 경로, 공개 글 상세(/posts/[slug]), 개발 일기 상세(/dev-logs/[id])를 포함한다.
 * 조회가 실패하면(환경 변수 없음 등) 그 항목만 빼고 돌려주어 응답이 실패하지 않게 한다.
 * 수정 모드(?edit=1)는 같은 URL의 변형이라 넣지 않는다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = SITEMAP_PATHS.map((path) => ({
    url: `${siteConfig.url}${path === "/" ? "" : path}`,
    lastModified: new Date(),
  }));
  const [posts, devLogs] = await Promise.all([
    getSitemapPosts().catch(() => []),
    getSitemapDevLogs().catch(() => []),
  ]);
  const postEntries = posts.map((post) => ({
    url: `${siteConfig.url}/posts/${post.slug}`,
    lastModified: new Date(post.updatedAt),
  }));
  const devLogEntries = devLogs.map((devLog) => ({
    url: `${siteConfig.url}/dev-logs/${devLog.id}`,
    lastModified: new Date(devLog.updatedAt),
  }));
  return [...staticEntries, ...postEntries, ...devLogEntries];
}
