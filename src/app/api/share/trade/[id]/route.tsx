import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { tradePnl } from "@/lib/pnl";
import { fmtSignedMoney, fmtDate } from "@/lib/format";
import { shareCard } from "@/lib/sharecard";

/** Branded share image of a single closed trade (owner only). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return new Response("Not signed in", { status: 401 });

  const { id } = await ctx.params;
  const [trade, settings] = await Promise.all([
    prisma.trade.findFirst({ where: { id, userId } }),
    prisma.settings.findUnique({ where: { userId } }),
  ]);
  if (!trade) return new Response("Not found", { status: 404 });

  const currency = settings?.currency ?? "USD";
  const pnl = tradePnl(trade);
  const pct =
    trade.exitPrice != null && trade.entryPrice
      ? ((trade.direction === "SHORT" ? trade.entryPrice - trade.exitPrice : trade.exitPrice - trade.entryPrice) /
          trade.entryPrice) *
        100
      : null;

  return shareCard({
    eyebrow: `${trade.symbol} · ${trade.direction}${trade.strategy ? ` · ${trade.strategy}` : ""}`,
    headline: pnl == null ? "OPEN" : fmtSignedMoney(pnl, currency),
    headlineTone: pnl == null ? "ink" : pnl >= 0 ? "profit" : "loss",
    stats: [
      { label: "Entry", value: String(trade.entryPrice), tone: "ink" },
      { label: "Exit", value: trade.exitPrice == null ? "—" : String(trade.exitPrice), tone: "ink" },
      { label: "Move", value: pct == null ? "—" : `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`, tone: pct != null && pct >= 0 ? "profit" : "loss" },
    ],
    footnote: fmtDate(trade.entryDate.toISOString()),
  });
}
