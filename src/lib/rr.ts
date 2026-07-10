import { etDateOf } from "./trading-day";

/** Average of the R:R values present on the trades (ignores trades with no R:R). */
export function avgRR(trades: { rr?: number | null }[]): number | null {
  const vals = trades.map((t) => t.rr).filter((v): v is number => v != null);
  if (!vals.length) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

/** "YYYY-MM-DD" of the Monday that starts the New York week containing `nyDate`. */
export function nyWeekStart(nyDate: string): string {
  const [y, m, d] = nyDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const off = (dt.getUTCDay() + 6) % 7; // days since Monday (Mon=0)
  dt.setUTCDate(dt.getUTCDate() - off);
  return dt.toISOString().slice(0, 10);
}

/**
 * Average R:R for the current New York week and month, over the trades' entry
 * dates. Returns null for a period with no R:R data.
 */
export function weeklyMonthlyRR(
  trades: { rr?: number | null; entryDate: Date }[],
  now: Date = new Date(),
): { week: number | null; month: number | null } {
  const today = etDateOf(now);
  const weekStart = nyWeekStart(today);
  const monthPrefix = today.slice(0, 7);
  const week = avgRR(trades.filter((t) => etDateOf(t.entryDate) >= weekStart && etDateOf(t.entryDate) <= today));
  const month = avgRR(trades.filter((t) => etDateOf(t.entryDate).startsWith(monthPrefix)));
  return { week, month };
}
