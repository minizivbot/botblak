import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { etToday } from "@/lib/trading-day";
import { zodMessage } from "@/lib/validation";

const schema = z.object({
  bias: z.union([z.enum(["long", "short", "neutral"]), z.literal(""), z.null()]).optional()
    .transform((v) => (v === "" ? null : v ?? null)),
  focus: z.string().trim().max(30).nullish().transform((s) => s || null),
  maxTrades: z
    .union([z.coerce.number().int().min(1).max(50), z.literal(""), z.null()])
    .optional()
    .transform((v) => (typeof v === "number" ? v : null)),
  note: z.string().trim().max(2000).nullish().transform((s) => s || null),
});

/** Today's (New York day) pre-market plan. */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const plan = await prisma.dayPlan.findUnique({ where: { userId_date: { userId, date: etToday() } } });
  return NextResponse.json({ plan });
}

export async function PUT(req: NextRequest) {
  try {
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
  } catch (e) {
    console.error("PUT /api/day-plan failed:", e);
    return NextResponse.json({ error: "Failed to save plan" }, { status: 500 });
  }
}
