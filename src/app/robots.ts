import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/** 검색 엔진 크롤러 정책 (/robots.txt) */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
