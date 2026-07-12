import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { zodMessage } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  emoji: z.string().trim().max(8).optional(),
  rules: z.array(z.string().trim().min(1).max(120)).min(1).max(12).optional(),
});

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { id } = await ctx.params;
    const existing = await prisma.playbook.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: "Playbook not found" }, { status: 404 });

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });

    const { rules, ...rest } = parsed.data;
    const playbook = await prisma.playbook.update({
      where: { id },
      data: { ...rest, ...(rules ? { rules: JSON.stringify(rules) } : {}) },
    });
    return NextResponse.json({ playbook });
  } catch (e) {
    console.error("PUT /api/playbooks/[id] failed:", e);
    return NextResponse.json({ error: "Failed to update playbook" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { id } = await ctx.params;
    const existing = await prisma.playbook.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: "Playbook not found" }, { status: 404 });

    await prisma.playbook.delete({ where: { id } }); // trades keep their data, playbookId nulls out
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/playbooks/[id] failed:", e);
    return NextResponse.json({ error: "Failed to delete playbook" }, { status: 500 });
  }
}
