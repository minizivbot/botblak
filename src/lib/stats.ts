import { tradePnl } from "./pnl";

export type StatsTrade = {
  id: string;
  symbol: string;
  direction: string;
  entryPrice: number;
  exitPrice: number | null;
  size: number;
  fees: number;
  entryDate: Date;
  exitDate: Date | null;
  strategy: string | null;
};

export type DashboardStats = {
  totalPnl: number;
  tradeCount: number;
  closedCount: number;
  winRate: number | null;
  profitFactor: number | null;
  avgWin: number | null;
  avgLoss: number | null;
  expectancy: number | null;
  maxDrawdown: number;
  bestTrade: { symbol: string; pnl: number } | null;
  worstTrade: { symbol: string; pnl: number } | null;
};

export type ClosedTrade = StatsTrade & { pnl: number; closedAt: Date };

/** Closed trades with computed P&L, ordered by exit time. */
export function closedTrades(trades: StatsTrade[]): ClosedTrade[] {
  return trades
    .flatMap((t) => {
      const pnl = tradePnl(t);
      if (pnl == null || !t.exitDate) return [];
      return [{ ...t, pnl, closedAt: t.exitDate }];
    })
    .sort((a, b) => a.closedAt.getTime() - b.closedAt.getTime());
}

export function computeStats(trades: StatsTrade[], startingBalance: number): DashboardStats {
  const closed = closedTrades(trades);
  const pnls = closed.map((t) => t.pnl);
  const totalPnl = pnls.reduce((s, p) => s + p, 0);

  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);
  const grossWin = wins.reduce((s, p) => s + p, 0);
  const grossLoss = Math.abs(losses.reduce((s, p) => s + p, 0));

  const winRate = closed.length ? wins.length / closed.length : null;
  const avgWin = wins.length ? grossWin / wins.length : null;
  const avgLoss = losses.length ? grossLoss / losses.length : null;
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : wins.length ? Infinity : null;
  const expectancy = closed.length ? totalPnl / closed.length : null;

  // Max drawdown over the equity curve (peak-to-trough, in currency).
  let equity = startingBalance;
  let peak = startingBalance;
  let maxDrawdown = 0;
  for (const t of closed) {
    equity += t.pnl;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, peak - equity);
  }

  let best: ClosedTrade | null = null;
  let worst: ClosedTrade | null = null;
  for (const t of closed) {
    if (!best || t.pnl > best.pnl) best = t;
    if (!worst || t.pnl < worst.pnl) worst = t;
  }

  return {
    totalPnl,
    tradeCount: trades.length,
    closedCount: closed.length,
    winRate,
    profitFactor,
    avgWin,
    avgLoss,
    expectancy,
    maxDrawdown,
    bestTrade: best ? { symbol: best.symbol, pnl: best.pnl } : null,
    worstTrade: worst ? { symbol: worst.symbol, pnl: worst.pnl } : null,
  };
}

export function equityCurve(trades: StatsTrade[], startingBalance: number) {
  let equity = startingBalance;
  const points = [{ date: null as string | null, equity }];
  for (const t of closedTrades(trades)) {
    equity += t.pnl;
    points.push({ date: t.closedAt.toISOString(), equity });
  }
  return points;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** ISO week key like "2026-W23". */
function weekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function pnlByPeriod(trades: StatsTrade[], period: "day" | "week" | "month") {
  const buckets = new Map<string, number>();
  for (const t of closedTrades(trades)) {
    const key =
      period === "day"
        ? dayKey(t.closedAt)
        : period === "week"
          ? weekKey(t.closedAt)
          : t.closedAt.toISOString().slice(0, 7);
    buckets.set(key, (buckets.get(key) ?? 0) + t.pnl);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, pnl]) => ({ label, pnl }));
}

export function pnlByGroup(trades: StatsTrade[], key: "symbol" | "strategy") {
  const buckets = new Map<string, { pnl: number; count: number }>();
  for (const t of closedTrades(trades)) {
    const group = (key === "symbol" ? t.symbol : t.strategy) ?? "Untagged";
    const b = buckets.get(group) ?? { pnl: 0, count: 0 };
    b.pnl += t.pnl;
    b.count += 1;
    buckets.set(group, b);
  }
  return [...buckets.entries()]
    .map(([label, { pnl, count }]) => ({ label, pnl, count }))
    .sort((a, b) => b.pnl - a.pnl);
}

/** Daily net P&L keyed by "YYYY-MM-DD", for the calendar heatmap. */
export function dailyPnlMap(trades: StatsTrade[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of closedTrades(trades)) {
    const key = dayKey(t.closedAt);
    out[key] = (out[key] ?? 0) + t.pnl;
  }
  return out;
}
