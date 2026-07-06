/**
 * Canonical public URL of the site, used for metadata, OG images, sitemap and
 * robots. Set NEXT_PUBLIC_SITE_URL to your custom domain in production.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://tradingjanrel.vercel.app").replace(/\/$/, "");
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");
