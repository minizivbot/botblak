import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { id } = await ctx.params;
    const existing = await prisma.propTxn.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    await prisma.propTxn.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/prop-txns/[id] failed:", e);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
