import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, verifySessionValue } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/register", "/privacy", "/terms"];

// Pages a logged-out visitor may browse as a live demo (read-only). Everything
// else (journal, import, settings, all mutating APIs) still requires sign-in.
const GUEST_PAGES = ["/", "/accounts", "/trades", "/learn", "/motivation", "/prop-firms", "/pricing", "/opengraph-image"];

/** Baseline security headers applied to every response. */
function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const allow = () => withSecurityHeaders(NextResponse.next());

  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/api/auth/")) {
    return allow();
  }

  const userId = await verifySessionValue(req.cookies.get(AUTH_COOKIE)?.value);
  if (userId) return allow();

  // Guests get the public showcase pages (and any trader profile under /u/).
  if (GUEST_PAGES.includes(pathname) || pathname.startsWith("/u/")) return allow();

  if (pathname.startsWith("/api/")) {
    return withSecurityHeaders(NextResponse.json({ error: "Not signed in" }, { status: 401 }));
  }
  const login = req.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  return withSecurityHeaders(NextResponse.redirect(login));
}

export const config = {
  // Protect everything except Next internals, crawler files (robots.txt,
  // sitemap.xml, search-engine verification .html files), and static assets.
  // These must be reachable by bots with no session cookie, so the auth
  // redirect must never run for them.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|sw.js|.*\\.(?:png|jpg|jpeg|webp|gif|svg|ico|html|txt|xml|webmanifest|js)$).*)",
  ],
};
