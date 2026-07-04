import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { importTradesSchema, zodMessage } from "@/lib/validation";
import { requireUserId } from "@/lib/auth";

/** Bulk-create trades parsed from a CSV on the client. Dedupes on externalId per user. */
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const parsed = importTradesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });
    }

    const { trades, source } = parsed.data;
    const externalIds = trades.map((t) => t.externalId).filter((x): x is string => Boolean(x));
    const existing = externalIds.length
      ? await prisma.trade.findMany({
          where: { userId, externalId: { in: externalIds } },
          select: { externalId: true },
        })
      : [];
    const seen = new Set(existing.map((e) => e.externalId));

    let imported = 0;
    let skipped = 0;
    for (const t of trades) {
      if (t.externalId && seen.has(t.externalId)) {
        skipped++;
        continue;
      }
      if (t.externalId) seen.add(t.externalId);
      await prisma.trade.create({ data: { ...t, source, userId } });
      imported++;
    }

    return NextResponse.json({ imported, skipped });
  } catch (e) {
    console.error("POST /api/import/csv failed:", e);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
