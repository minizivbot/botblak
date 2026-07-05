import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionValue, AUTH_COOKIE } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  try {
    // Throttle repeated sign-in attempts from one IP (brute-force protection).
    const rl = rateLimit(`login:${clientIp(req)}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${rl.retryAfter}s.` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
      );
    }

    const body = (await req.json().catch(() => null)) as { username?: string; password?: string } | null;
    const username = body?.username?.trim().toLowerCase() ?? "";
    const password = body?.password ?? "";
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (user && !user.passwordHash) {
      return NextResponse.json({ error: "This account signs in with Google" }, { status: 401 });
    }
    if (!user || !verifyPassword(password, user.passwordHash!)) {
      return NextResponse.json({ error: "Wrong username or password" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true, username: user.username });
    res.cookies.set(AUTH_COOKIE, await createSessionValue(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (e) {
    console.error("POST /api/auth/login failed:", e);
    return NextResponse.json({ error: "Sign-in failed" }, { status: 500 });
  }
}
