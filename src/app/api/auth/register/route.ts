import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionValue, AUTH_COOKIE } from "@/lib/auth";
import { zodMessage } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/ratelimit";

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username is too long")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Username can contain letters, numbers, _ . -")
    .transform((s) => s.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export async function POST(req: NextRequest) {
  try {
    // Cap new-account creation per IP to slow signup spam.
    const rl = rateLimit(`register:${clientIp(req)}`, 5, 60 * 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Too many sign-ups from here. Try again later.` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });
    }
    const { username, password } = parsed.data;

    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) {
      return NextResponse.json({ error: "That username is already taken" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash: hashPassword(password),
        settings: { create: { startingBalance: 10000, currency: "USD" } },
        accounts: { create: { name: "Main" } },
      },
    });

    const res = NextResponse.json({ ok: true, username: user.username }, { status: 201 });
    res.cookies.set(AUTH_COOKIE, await createSessionValue(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (e) {
    console.error("POST /api/auth/register failed:", e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
