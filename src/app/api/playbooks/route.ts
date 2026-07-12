import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { zodMessage } from "@/lib/validation";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(40),
  emoji: z.string().trim().max(8).optional().transform((s) => s || "📘"),
  rules: z.array(z.string().trim().min(1).max(120)).min(1, "Add at least one rule").max(12),
});

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const playbooks = await prisma.playbook.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ playbooks });
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });

    const playbook = await prisma.playbook.create({
      data: { userId, name: parsed.data.name, emoji: parsed.data.emoji, rules: JSON.stringify(parsed.data.rules) },
    });
    return NextResponse.json({ playbook }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error && e.message.includes("Unique") ? "You already have a playbook with that name" : "Failed to create playbook";
    console.error("POST /api/playbooks failed:", e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
