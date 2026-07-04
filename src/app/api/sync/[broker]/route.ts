import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBroker, BrokerError, brokers } from "@/lib/brokers";
import { requireUserId } from "@/lib/auth";

/** GET: list available brokers and whether their keys are configured. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ broker: string }> }) {
  const { broker } = await ctx.params;
  if (broker === "status") {
    return NextResponse.json({
      brokers: Object.values(brokers).map((b) => ({
        id: b.id,
        label: b.label,
        configured: b.isConfigured(),
      })),
    });
  }
  const adapter = getBroker(broker);
  if (!adapter) return NextResponse.json({ error: `Unknown broker "${broker}"` }, { status: 404 });
  return NextResponse.json({ id: adapter.id, label: adapter.label, configured: adapter.isConfigured() });
}

/** POST: sync trades from the broker's API into the journal. */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ broker: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { broker } = await ctx.params;
  const adapter = getBroker(broker);
  if (!adapter) {
    return NextResponse.json({ error: `Unknown broker "${broker}"` }, { status: 404 });
  }

  try {
    const { trades, detail } = await adapter.fetchTrades();

    let imported = 0;
    let skipped = 0;
    for (const t of trades) {
      const exists = await prisma.trade.findFirst({
        where: { userId, externalId: t.externalId },
        select: { id: true },
      });
      if (exists) {
        skipped++;
        continue;
      }
      await prisma.trade.create({
        data: {
          userId,
          symbol: t.symbol,
          direction: t.direction,
          entryPrice: t.entryPrice,
          exitPrice: t.exitPrice,
          size: t.size,
          fees: t.fees,
          entryDate: t.entryDate,
          exitDate: t.exitDate,
          notes: t.notes ?? null,
          externalId: t.externalId,
          source: adapter.id,
        },
      });
      imported++;
    }

    return NextResponse.json({ imported, skipped, detail });
  } catch (e) {
    if (e instanceof BrokerError) {
      return NextResponse.json({ error: e.message }, { status: e.status === 401 || e.status === 403 ? 401 : 502 });
    }
    console.error(`POST /api/sync/${broker} failed:`, e);
    return NextResponse.json({ error: "Broker sync failed unexpectedly" }, { status: 500 });
  }
}
