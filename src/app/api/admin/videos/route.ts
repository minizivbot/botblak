import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { zodMessage } from "@/lib/validation";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  youtubeId: z.string().trim().regex(/^[\w-]{6,20}$/, "That doesn't look like a YouTube video ID"),
  category: z.string().trim().min(1).max(40).default("General"),
  minutes: z.number().int().min(1).max(600).nullish(),
  sortOrder: z.number().int().min(0).max(999).default(0),
  enabled: z.boolean().default(true),
});

/** Admin: all video lessons (including disabled ones). */
export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const videos = await prisma.videoLesson.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ videos });
}

/** Admin: add a lesson. */
export async function POST(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });

  const video = await prisma.videoLesson.create({ data: parsed.data });
  return NextResponse.json({ video }, { status: 201 });
}
