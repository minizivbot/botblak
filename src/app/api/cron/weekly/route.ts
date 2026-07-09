import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { closedTrades, type StatsTrade } from "@/lib/stats";
import { sendPushToUser, wantsPush } from "@/lib/push";
import { fmtSignedMoney } from "@/lib/format";
import { isCronCall } from "@/lib/cron";

/**
 * Friday-evening recap (Vercel cron, after the NY close): each subscribed
 * user who closed trades this week gets their personal weekly scorecard.
 */
export async function GET(req: NextRequest) {
  if (!isCronCall(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const subscribed = await prisma.pushSubscription.findMany({ distinct: ["userId"], select: { userId: true } });

  let sent = 0;
  for (const { userId } of subscribed) {
    if (!(await wantsPush(userId, "notifyWeekly"))) continue;
    const closed = closedTrades(
      (await prisma.trade.findMany({ where: { userId, exitDate: { gte: weekAgo } } })) as StatsTrade[],
    );
    if (closed.length === 0) continue;

    const pnl = closed.reduce((s, t) => s + t.pnl, 0);
    const wins = closed.filter((t) => t.pnl > 0).length;
    const settings = await prisma.settings.findUnique({ where: { userId }, select: { currency: true } });
    const currency = settings?.currency ?? "USD";

    await sendPushToUser(userId, {
      title: `📊 Your week: ${fmtSignedMoney(pnl, currency)}`,
      body: `${closed.length} trades, ${wins} winners. ${
        pnl >= 0 ? "Protect the habits that made this week green." : "Red week — read your worst day before Monday."
      }`,
      url: "/calendar",
    });
    sent++;
  }
  return NextResponse.json({ sent });
}
