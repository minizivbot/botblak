import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { zodMessage } from "@/lib/validation";
import { etToday } from "@/lib/trading-day";

const schema = z.object({
  bias: z.enum(["long", "short", "neutral"]).nullish(),
  focus: z.string().trim().max(20).nullish().transform((s) => s || null),
  maxTrades: z.number().int().min(1).max(50).nullish(),
  note: z.string().trim().max(2000).nullish().transform((s) => s || null),
});

/** Today's pre-market plan (New York trading day). */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const plan = await prisma.dayPlan.findUnique({
    where: { userId_date: { userId, date: etToday() } },
  });
  return NextResponse.json({ plan });
}

/** Create or update today's plan. */
export async function PUT(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });

  const date = etToday();
  const plan = await prisma.dayPlan.upsert({
    where: { userId_date: { userId, date } },
    update: parsed.data,
    create: { userId, date, ...parsed.data },
  });
  return NextResponse.json({ plan });
}
