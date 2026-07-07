import { prisma } from "./prisma";
import { propStatus } from "./prop";
import { closedTrades, type StatsTrade } from "./stats";
import { sendPushToUser } from "./push";
import { fmtSignedMoney, fmtMoney } from "./format";

/**
 * Fire push notifications for side effects of saving a closed trade: a prop
 * account newly passing its challenge, or today's realized loss newly
 * crossing the daily loss limit. Best-effort — never throws, so a push
 * failure can't block saving the trade itself.
 */
export async function checkTradeAlerts(userId: string, accountId: string | null): Promise<void> {
  try {
    if (accountId) {
      const account = await prisma.account.findUnique({ where: { id: accountId } });
      if (account && account.propStartBalance != null && !account.propFunded) {
        const trades = await prisma.trade.findMany({ where: { userId, accountId } });
        const status = propStatus(account, trades);
        if (status.targetReached && !status.breached) {
          await prisma.account.update({ where: { id: account.id }, data: { propFunded: true } });
          await sendPushToUser(userId, {
            title: "🎉 Challenge passed!",
            body: `${account.name} just hit its profit target — marked FUNDED.`,
            url: "/accounts",
          });
        }
      }
    }

    const settings = await prisma.settings.findUnique({ where: { userId } });
    if (settings?.maxDailyLoss != null) {
      const startOfToday = new Date();
      startOfToday.setUTCHours(0, 0, 0, 0);
      const todayTrades = closedTrades(
        (await prisma.trade.findMany({ where: { userId, exitDate: { gte: startOfToday } } })) as StatsTrade[],
      );
      const total = todayTrades.reduce((s, t) => s + t.pnl, 0);
      const beforeLast = total - (todayTrades[todayTrades.length - 1]?.pnl ?? 0);
      const limit = settings.maxDailyLoss;
      if (total <= -limit && beforeLast > -limit) {
        await sendPushToUser(userId, {
          title: "🛑 Daily loss limit hit",
          body: `Today: ${fmtSignedMoney(total, settings.currency)} — your limit is ${fmtMoney(limit, settings.currency)}. Time to stop.`,
          url: "/",
        });
      }
    }
  } catch (e) {
    console.error("checkTradeAlerts failed:", e);
  }
}
