import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { zodMessage } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  youtubeId: z.string().trim().regex(/^[\w-]{6,20}$/).optional(),
  category: z.string().trim().min(1).max(40).optional(),
  minutes: z.number().int().min(1).max(600).nullish(),
  sortOrder: z.number().int().min(0).max(999).optional(),
  enabled: z.boolean().optional(),
});

/** Admin: edit a lesson. */
export async function PUT(req: NextRequest, ctx: Ctx) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { id } = await ctx.params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });

  const video = await prisma.videoLesson.update({ where: { id }, data: parsed.data }).catch(() => null);
  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });
  return NextResponse.json({ video });
}

/** Admin: delete a lesson. */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { id } = await ctx.params;
  await prisma.videoLesson.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
