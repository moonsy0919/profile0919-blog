import type { MetadataRoute } from "next";
import { NAV_LINKS, siteConfig } from "@/config/site";

/** 사이트맵 (/sitemap.xml). 네비게이션에 등록된 경로를 자동으로 포함한다. */
export default function sitemap(): MetadataRoute.Sitemap {
  return NAV_LINKS.map(({ href }) => ({
    url: `${siteConfig.url}${href === "/" ? "" : href}`,
    lastModified: new Date(),
  }));
}
