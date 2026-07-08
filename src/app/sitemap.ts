import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Public, indexable pages. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = ["", "/learn", "/leaderboard", "/prop-firms", "/pricing", "/motivation", "/login", "/register", "/privacy", "/terms"];
  return paths.map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: p === "" || p === "/leaderboard" ? "daily" : "weekly",
    priority: p === "" ? 1 : 0.6,
  }));
}
