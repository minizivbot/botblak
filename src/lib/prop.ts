import { tradePnl } from "./pnl";

export type PropConfig = {
  propStartBalance: number | null;
  propProfitTarget: number | null;
  propMaxDrawdown: number | null;
  propDrawdownType: string | null; // "trailing" | "static"
  propMaxDailyLoss: number | null;
};

export type PropTrade = {
  direction: string;
  entryPrice: number;
  exitPrice: number | null;
  size: number;
  fees: number;
  exitDate: Date | null;
};

export type PropStatus = {
  enabled: boolean;
  startBalance: number;
  currentBalance: number;
  netProfit: number;
  // Profit target
  target: number | null;
  targetProgress: number | null; // 0..1+ of the target
  targetReached: boolean;
  // Drawdown
  maxDrawdown: number | null;
  drawdownType: "trailing" | "static";
  drawdownLine: number | null; // balance you must stay above
  cushion: number | null; // currentBalance - drawdownLine
  minCushion: number | null; // worst cushion ever reached
  breached: boolean; // did equity ever cross the line
  // Consistency (largest winning day as a share of total profit)
  bestDayShare: number | null;
};

/**
 * Evaluate a prop account against its firm rules. Trailing drawdown follows the
 * running peak balance; static drawdown is fixed off the starting balance.
 * Balances are computed on realized (closed) trades in chronological order.
 */
export function propStatus(cfg: PropConfig, trades: PropTrade[]): PropStatus {
  const enabled = cfg.propStartBalance != null && cfg.propStartBalance > 0;
  const startBalance = cfg.propStartBalance ?? 0;

  const closed = trades
    .filter((t) => t.exitPrice != null && t.exitDate != null)
    .map((t) => ({ pnl: tradePnl(t) ?? 0, day: t.exitDate!.toISOString().slice(0, 10) }))
    .sort((a, b) => (a.day < b.day ? -1 : 1));

  let balance = startBalance;
  let peak = startBalance;
  let minCushion = Infinity;
  let breached = false;
  const drawdownType = cfg.propDrawdownType === "static" ? "static" : "trailing";

  const dayPnl = new Map<string, number>();
  for (const t of closed) {
    balance += t.pnl;
    peak = Math.max(peak, balance);
    dayPnl.set(t.day, (dayPnl.get(t.day) ?? 0) + t.pnl);
    if (cfg.propMaxDrawdown != null) {
      const line = (drawdownType === "trailing" ? peak : startBalance) - cfg.propMaxDrawdown;
      const cushion = balance - line;
      minCushion = Math.min(minCushion, cushion);
      if (cushion <= 0) breached = true;
    }
  }

  const currentBalance = balance;
  const netProfit = currentBalance - startBalance;

  const drawdownLine =
    cfg.propMaxDrawdown != null
      ? (drawdownType === "trailing" ? peak : startBalance) - cfg.propMaxDrawdown
      : null;
  const cushion = drawdownLine != null ? currentBalance - drawdownLine : null;

  // Consistency (largest winning day as a share of total profit) only means
  // something once you've traded several days — with one or two trading days a
  // single day is trivially ~100% of profit, which isn't a real warning.
  const MIN_DAYS_FOR_CONSISTENCY = 4;
  const bestDay = Math.max(0, ...[...dayPnl.values()]);
  const bestDayShare =
    dayPnl.size >= MIN_DAYS_FOR_CONSISTENCY && netProfit > 0 && bestDay > 0 ? bestDay / netProfit : null;

  return {
    enabled,
    startBalance,
    currentBalance,
    netProfit,
    target: cfg.propProfitTarget ?? null,
    targetProgress: cfg.propProfitTarget ? netProfit / cfg.propProfitTarget : null,
    targetReached: cfg.propProfitTarget != null && netProfit >= cfg.propProfitTarget,
    maxDrawdown: cfg.propMaxDrawdown ?? null,
    drawdownType,
    drawdownLine,
    cushion,
    minCushion: minCushion === Infinity ? null : minCushion,
    breached,
    bestDayShare,
  };
}
