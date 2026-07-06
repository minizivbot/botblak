import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { computeStats, type StatsTrade } from "@/lib/stats";
import { fmtSignedMoney, fmtPct, fmtNum } from "@/lib/format";
import { shareCard } from "@/lib/sharecard";

/** Branded share image of the signed-in user's overall stats. */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return new Response("Not signed in", { status: 401 });

  const [user, settings, trades] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { username: true } }),
    prisma.settings.findUnique({ where: { userId } }),
    prisma.trade.findMany({
      where: { userId },
      select: { id: true, symbol: true, direction: true, entryPrice: true, exitPrice: true, size: true, fees: true, entryDate: true, exitDate: true, strategy: true },
    }),
  ]);
  const currency = settings?.currency ?? "USD";
  const s = computeStats(trades as StatsTrade[], 0);

  return shareCard({
    eyebrow: `@${user?.username ?? "trader"} · ${s.closedCount} trades`,
    headline: fmtSignedMoney(s.totalPnl, currency),
    headlineTone: s.totalPnl >= 0 ? "profit" : "loss",
    stats: [
      { label: "Win rate", value: s.winRate == null ? "—" : fmtPct(s.winRate), tone: "ink" },
      { label: "Profit factor", value: s.profitFactor == null ? "—" : s.profitFactor === Infinity ? "Perfect" : fmtNum(s.profitFactor), tone: "ink" },
      { label: "Expectancy", value: s.expectancy == null ? "—" : fmtSignedMoney(s.expectancy, currency), tone: s.expectancy && s.expectancy >= 0 ? "profit" : "loss" },
    ],
    footnote: "My trading journal",
  });
}
