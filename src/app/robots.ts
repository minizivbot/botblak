import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Let crawlers index the public marketing pages; keep private areas out. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/settings", "/journal", "/import", "/admin", "/u/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
