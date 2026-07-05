import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionValue, AUTH_COOKIE } from "@/lib/auth";

type GoogleTokens = { id_token?: string; error?: string };
type GoogleProfile = { sub: string; email?: string; name?: string };

/** Step 2: exchange the code, find-or-create the user, set the session. */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const fail = (reason: string) => NextResponse.redirect(new URL(`/login?error=${reason}`, origin));

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail("google-not-configured");

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("g_state")?.value;
  if (!code || !state || !cookieState || state !== cookieState) return fail("google-state");

  // Exchange the authorization code for tokens.
  let tokens: GoogleTokens;
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(15000),
    });
    tokens = (await res.json()) as GoogleTokens;
    if (!res.ok || !tokens.id_token) return fail("google-token");
  } catch {
    return fail("google-unreachable");
  }

  // The id_token payload carries the verified identity (came directly from Google over TLS).
  let profile: GoogleProfile;
  try {
    const payload = tokens.id_token.split(".")[1];
    profile = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as GoogleProfile;
    if (!profile.sub) return fail("google-profile");
  } catch {
    return fail("google-profile");
  }

  // Find by googleId, else link by email, else create a new user.
  let user = await prisma.user.findUnique({ where: { googleId: profile.sub } });
  if (!user && profile.email) {
    const byEmail = await prisma.user.findUnique({ where: { email: profile.email.toLowerCase() } });
    if (byEmail) {
      user = await prisma.user.update({ where: { id: byEmail.id }, data: { googleId: profile.sub } });
    }
  }
  if (!user) {
    // Respect the admin's "registration closed" switch for brand-new accounts.
    const { getSiteConfig } = await import("@/lib/siteconfig");
    if (!(await getSiteConfig()).registrationOpen) return fail("registration-closed");

    const base =
      (profile.email?.split("@")[0] || profile.name || "trader")
        .toLowerCase()
        .replace(/[^a-z0-9_.-]/g, "")
        .slice(0, 24) || "trader";
    let username = base;
    for (let i = 0; i < 10; i++) {
      const exists = await prisma.user.findUnique({ where: { username } });
      if (!exists) break;
      username = `${base}${Math.floor(Math.random() * 9000 + 1000)}`;
    }
    user = await prisma.user.create({
      data: {
        username,
        googleId: profile.sub,
        email: profile.email?.toLowerCase() ?? null,
        passwordHash: null,
        settings: { create: { startingBalance: 10000, currency: "USD" } },
        accounts: { create: { name: "Main" } },
      },
    });
  }

  const res = NextResponse.redirect(new URL("/", origin));
  res.cookies.set(AUTH_COOKIE, await createSessionValue(user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  res.cookies.set("g_state", "", { path: "/", maxAge: 0 });
  return res;
}
