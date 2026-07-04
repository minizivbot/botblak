import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { journalSchema, zodMessage } from "@/lib/validation";
import { requireUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const entries = await prisma.journalEntry.findMany({ where: { userId }, orderBy: { date: "desc" } });
    return NextResponse.json({ entries });
  } catch (e) {
    console.error("GET /api/journal failed:", e);
    return NextResponse.json({ error: "Failed to load journal" }, { status: 500 });
  }
}

/** Upsert the entry for a given day. */
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const parsed = journalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });
    }
    const entry = await prisma.journalEntry.upsert({
      where: { userId_date: { userId, date: parsed.data.date } },
      update: parsed.data,
      create: { ...parsed.data, userId },
    });
    return NextResponse.json({ entry });
  } catch (e) {
    console.error("POST /api/journal failed:", e);
    return NextResponse.json({ error: "Failed to save journal entry" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const date = req.nextUrl.searchParams.get("date");
    if (!date) return NextResponse.json({ error: "date query param required" }, { status: 400 });
    await prisma.journalEntry.delete({ where: { userId_date: { userId, date } } }).catch(() => null);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/journal failed:", e);
    return NextResponse.json({ error: "Failed to delete journal entry" }, { status: 500 });
  }
}
