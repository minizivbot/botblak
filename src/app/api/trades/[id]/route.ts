import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tradeSchema, zodMessage } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const trade = await prisma.trade.findUnique({ where: { id } });
  if (!trade) return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  return NextResponse.json({ trade });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const parsed = tradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });
    }
    const existing = await prisma.trade.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Trade not found" }, { status: 404 });

    const trade = await prisma.trade.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ trade });
  } catch (e) {
    console.error("PUT /api/trades/[id] failed:", e);
    return NextResponse.json({ error: "Failed to update trade" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const existing = await prisma.trade.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Trade not found" }, { status: 404 });

    await prisma.trade.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/trades/[id] failed:", e);
    return NextResponse.json({ error: "Failed to delete trade" }, { status: 500 });
  }
}
