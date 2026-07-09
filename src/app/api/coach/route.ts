import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { isProUser } from "@/lib/plan";
import { aiConfigured, generateCoachReview } from "@/lib/ai";
import { rateLimit } from "@/lib/ratelimit";

/** Past coach reviews, newest first. */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const reports = await prisma.aiReport.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, body: true, createdAt: true },
  });
  return NextResponse.json({ reports, configured: aiConfigured() });
}

/** Generate a new coaching review (Pro; capped per day — each run costs real money). */
export async function POST() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  if (!(await isProUser(userId))) {
    return NextResponse.json({ error: "The AI coach is a Pro feature — see /pricing" }, { status: 403 });
  }
  if (!aiConfigured()) {
    return NextResponse.json({ error: "The AI coach isn't configured yet — coming very soon" }, { status: 503 });
  }
  const rl = rateLimit(`coach:${userId}`, 3, 24 * 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "You've used today's coach sessions — fresh eyes tomorrow" }, { status: 429 });
  }

  try {
    const body = await generateCoachReview(userId);
    return NextResponse.json({ body }, { status: 201 });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "The coach is busy right now — try again in a minute" }, { status: 429 });
    }
    if (e instanceof Anthropic.AuthenticationError) {
      console.error("coach: invalid ANTHROPIC_API_KEY");
      return NextResponse.json({ error: "The coach isn't configured correctly — the site owner has been notified" }, { status: 503 });
    }
    if (e instanceof Anthropic.APIConnectionError) {
      return NextResponse.json({ error: "Couldn't reach the coach — try again shortly" }, { status: 502 });
    }
    if (e instanceof Anthropic.APIError) {
      console.error("coach API error:", e.status, e.message);
      return NextResponse.json({ error: "The coach hit a snag — try again shortly" }, { status: 502 });
    }
    console.error("coach failed:", e);
    return NextResponse.json({ error: "The coach hit a snag — try again shortly" }, { status: 500 });
  }
}
