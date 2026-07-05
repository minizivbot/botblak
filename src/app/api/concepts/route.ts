import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { parseConcepts } from "@/lib/concepts";

const listSchema = z.array(z.string().trim().min(1).max(40)).max(60);

/** The user's personal concept list (defaults until they customize it). */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { concepts: true } });
  const concepts = parseConcepts(user?.concepts);
  return NextResponse.json({ concepts });
}

/** Replace the user's concept list (add/remove happen client-side). */
export async function PUT(req: NextRequest) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = listSchema.safeParse(body?.concepts);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid concepts list (max 60 items, 40 chars each)" }, { status: 400 });
    }
    const unique = [...new Set(parsed.data)];
    await prisma.user.update({ where: { id: userId }, data: { concepts: JSON.stringify(unique) } });
    return NextResponse.json({ concepts: unique });
  } catch (e) {
    console.error("PUT /api/concepts failed:", e);
    return NextResponse.json({ error: "Failed to save concepts" }, { status: 500 });
  }
}
