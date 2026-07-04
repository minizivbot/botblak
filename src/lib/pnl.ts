export type TradeLike = {
  direction: string;
  entryPrice: number;
  exitPrice: number | null;
  size: number;
  fees: number;
};

/** Net P&L for a closed trade; null while the trade is still open. */
export function tradePnl(t: TradeLike): number | null {
  if (t.exitPrice == null) return null;
  const perUnit =
    t.direction === "SHORT" ? t.entryPrice - t.exitPrice : t.exitPrice - t.entryPrice;
  return perUnit * t.size - t.fees;
}

/** P&L as a percentage of the position's entry value (null while open). */
export function tradePnlPct(t: TradeLike & { entryPrice: number }): number | null {
  const pnl = tradePnl(t);
  if (pnl == null) return null;
  const cost = t.entryPrice * t.size;
  return cost === 0 ? null : (pnl / cost) * 100;
}
