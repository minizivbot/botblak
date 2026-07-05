import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { zodMessage } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  blurb: z.string().trim().max(400).optional(),
  highlight: z.string().trim().max(80).nullish().transform((s) => s || null),
  affiliateUrl: z
    .string()
    .trim()
    .max(500)
    .refine((s) => s === "" || /^https?:\/\//i.test(s), "Must be a full https:// URL")
    .optional(),
  emoji: z.string().trim().max(8).optional(),
  sortOrder: z.number().int().optional(),
  enabled: z.boolean().optional(),
});

export async function PUT(req: NextRequest, ctx: Ctx) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const { id } = await ctx.params;
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });
  const firm = await prisma.propFirm.update({ where: { id }, data: parsed.data }).catch(() => null);
  if (!firm) return NextResponse.json({ error: "Firm not found" }, { status: 404 });
  return NextResponse.json({ firm });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const { id } = await ctx.params;
  await prisma.propFirm.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
