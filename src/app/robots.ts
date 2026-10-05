import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/search", "/api/"],
      },
    ],
    // /sitemap.xml is reserved by Next's metadata route and 404s; the real
    // index lives at /sitemap-index.xml.
    sitemap: [
      `${SITE_URL}/sitemap-index.xml`,
      `${SITE_URL}/news-sitemap.xml`,
    ],
    host: SITE_URL,
  };
}
