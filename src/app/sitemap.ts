import type { MetadataRoute } from "next";
import { SITEMAP_PATHS, siteConfig } from "@/config/site";

/** 사이트맵 (/sitemap.xml). SITEMAP_PATHS에 등록된 열린 경로만 포함한다. */
export default function sitemap(): MetadataRoute.Sitemap {
  return SITEMAP_PATHS.map((path) => ({
    url: `${siteConfig.url}${path === "/" ? "" : path}`,
    lastModified: new Date(),
  }));
}
