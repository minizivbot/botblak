import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, verifySessionValue } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/register"];

// Pages a logged-out visitor may browse as a live demo (read-only). Everything
// else (journal, import, settings, all mutating APIs) still requires sign-in.
const GUEST_PAGES = ["/", "/trades", "/learn", "/motivation", "/leaderboard", "/opengraph-image"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const userId = await verifySessionValue(req.cookies.get(AUTH_COOKIE)?.value);
  if (userId) return NextResponse.next();

  // Guests get the public showcase pages (and any trader profile under /u/).
  if (GUEST_PAGES.includes(pathname) || pathname.startsWith("/u/")) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const login = req.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  return NextResponse.redirect(login);
}

export const config = {
  // Protect everything except Next internals and static files with extensions.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|gif|svg|ico)$).*)"],
};
