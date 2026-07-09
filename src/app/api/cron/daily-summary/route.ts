import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { closedTrades, type StatsTrade } from "@/lib/stats";
import { sendPushToUser, wantsPush } from "@/lib/push";
import { fmtSignedMoney } from "@/lib/format";
import { etToday, etDateOf } from "@/lib/trading-day";
import { isCronCall } from "@/lib/cron";

/**
 * End-of-day scorecard (Vercel cron, ~17:05 New York — after the futures close):
 * each subscribed user who closed trades today gets their daily P&L, trade count
 * and green-day streak. Quiet days send nothing.
 */
export async function GET(req: NextRequest) {
  if (!isCronCall(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const today = etToday();
  // Look back ~36h so every trade closed on the NY trading day is in range,
  // then keep only the ones whose NY close date is actually today.
  const since = new Date(Date.now() - 36 * 60 * 60 * 1000);
  const subscribed = await prisma.pushSubscription.findMany({ distinct: ["userId"], select: { userId: true } });

  let sent = 0;
  for (const { userId } of subscribed) {
    if (!(await wantsPush(userId, "notifyDaily"))) continue;

    const recent = (await prisma.trade.findMany({ where: { userId, exitDate: { gte: since } } })) as StatsTrade[];
    const closed = closedTrades(recent);

    const todays = closed.filter((t) => etDateOf(t.closedAt) === today);
    if (todays.length === 0) continue;

    const pnl = todays.reduce((s, t) => s + t.pnl, 0);
    const wins = todays.filter((t) => t.pnl > 0).length;

    // Green-day streak ending today, from the last ~30 days of closed trades.
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const byDay = new Map<string, number>();
    for (const t of closed) {
      if (t.closedAt < monthAgo) continue;
      const key = etDateOf(t.closedAt);
      byDay.set(key, (byDay.get(key) ?? 0) + t.pnl);
    }
    const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i][1] > 0) streak++;
      else break;
    }

    const settings = await prisma.settings.findUnique({ where: { userId }, select: { currency: true } });
    const currency = settings?.currency ?? "USD";
    const flame = streak >= 2 ? ` 🔥 ${streak}-day green streak` : "";

    await sendPushToUser(userId, {
      title: `${pnl >= 0 ? "🟢" : "🔴"} Today: ${fmtSignedMoney(pnl, currency)}`,
      body: `${todays.length} trade${todays.length === 1 ? "" : "s"}, ${wins} winner${wins === 1 ? "" : "s"}.${flame || " Log the lesson while it's fresh."}`,
      url: "/calendar",
    });
    sent++;
  }
  return NextResponse.json({ sent });
}
