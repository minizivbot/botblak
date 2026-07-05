import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { zodMessage } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  isCopy: z.boolean().optional(),
});

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { id } = await ctx.params;
    const parsed = updateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });

    const existing = await prisma.account.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const account = await prisma.account.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ account });
  } catch (e) {
    console.error("PUT /api/accounts/[id] failed:", e);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { id } = await ctx.params;
    const existing = await prisma.account.findFirst({
      where: { id, userId },
      include: { _count: { select: { trades: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    if (existing._count.trades > 0) {
      return NextResponse.json(
        { error: `This account has ${existing._count.trades} trades. Move or delete them first.` },
        { status: 400 },
      );
    }

    await prisma.account.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/accounts/[id] failed:", e);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
