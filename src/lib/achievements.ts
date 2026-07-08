import { closedTrades, type StatsTrade } from "./stats";
import { killzone } from "./killzones";

/**
 * Achievements: badges computed live from the user's real trading data.
 * Every badge has a target and a current value, so locked ones show progress
 * ("64/100 trades") instead of just a grey lock.
 */

export type AchievementState = {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  unlocked: boolean;
  /** Progress toward the target (for locked badges). */
  current: number;
  target: number;
};

type Ctx = {
  trades: StatsTrade[];
  anyFunded: boolean;
  hasLossLimit: boolean;
};

/** Consecutive green days, counted over per-day net P&L in date order. */
function greenDayStreaks(dayPnls: number[]): { best: number; current: number } {
  let best = 0;
  let run = 0;
  for (const pnl of dayPnls) {
    run = pnl > 0 ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return { best, current: run };
}

export function computeAchievements(ctx: Ctx): AchievementState[] {
  const closed = closedTrades(ctx.trades);
  const wins = closed.filter((t) => t.pnl > 0).length;

  // Net P&L per day, in chronological order.
  const dayMap = new Map<string, number>();
  for (const t of closed) {
    const key = t.closedAt.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + t.pnl);
  }
  const dayPnls = [...dayMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  const streak = greenDayStreaks(dayPnls);
  const greenDays = dayPnls.filter((p) => p > 0).length;

  const last20 = closed.slice(-20);
  const last20WinRate = last20.length >= 20 ? last20.filter((t) => t.pnl > 0).length / 20 : 0;
  const bestTrade = closed.reduce((m, t) => Math.max(m, t.pnl), 0);
  const londonTrades = closed.filter((t) => killzone(t.entryDate) === "London KZ").length;

  // A green day that comes right after a losing day — getting back up is a skill.
  let comebacks = 0;
  for (let i = 1; i < dayPnls.length; i++) {
    if (dayPnls[i - 1] < 0 && dayPnls[i] > 0) comebacks++;
  }

  const defs: (Omit<AchievementState, "unlocked"> & { done?: boolean })[] = [
    { id: "first-blood", emoji: "🩸", name: "First Blood", desc: "Close your first trade", current: closed.length, target: 1 },
    { id: "green-day", emoji: "💚", name: "Green Day", desc: "Finish a day in profit", current: greenDays, target: 1 },
    { id: "ten-club", emoji: "🔟", name: "Ten Club", desc: "Close 10 trades", current: closed.length, target: 10 },
    { id: "streak-3", emoji: "🔥", name: "Heating Up", desc: "3 green days in a row", current: streak.best, target: 3 },
    { id: "streak-5", emoji: "🚀", name: "On Fire", desc: "5 green days in a row", current: streak.best, target: 5 },
    { id: "risk-guard", emoji: "🛡️", name: "Risk Guard", desc: "Set a daily loss limit in Settings", current: ctx.hasLossLimit ? 1 : 0, target: 1 },
    { id: "comeback", emoji: "🥊", name: "Comeback Kid", desc: "Follow a red day with a green one", current: comebacks, target: 1 },
    { id: "big-win", emoji: "💰", name: "Big Game", desc: "Bank $500+ on a single trade", current: Math.min(bestTrade, 500), target: 500 },
    { id: "sniper", emoji: "🎯", name: "Sniper", desc: "60% win rate over your last 20 trades", current: Math.round(last20WinRate * 100), target: 60 },
    { id: "london", emoji: "🌅", name: "Early Bird", desc: "Close 10 trades in the London killzone", current: londonTrades, target: 10 },
    { id: "century", emoji: "💯", name: "Century Club", desc: "Close 100 trades", current: closed.length, target: 100 },
    { id: "funded", emoji: "🏆", name: "FUNDED", desc: "Pass a prop challenge", current: ctx.anyFunded ? 1 : 0, target: 1 },
    { id: "half-k", emoji: "👑", name: "Ledger Legend", desc: "500 wins on the books", current: wins, target: 500 },
  ];

  return defs.map((d) => ({ ...d, unlocked: d.current >= d.target }));
}

/** Ids of unlocked achievements — stored on Settings so pushes fire once per badge. */
export function unlockedIds(list: AchievementState[]): string[] {
  return list.filter((a) => a.unlocked).map((a) => a.id);
}
