import { closedTrades, type StatsTrade } from "./stats";

/** The fixed vocabulary of trading mistakes a trader can tag on a trade. */
export const MISTAKES = [
  "Revenge trade",
  "No setup / FOMO",
  "Moved stop",
  "No stop loss",
  "Oversized",
  "Chased entry",
  "Broke my rules",
  "Exited early",
  "Held a loser",
  "Traded off-plan",
] as const;

/** A trade carrying an optional comma-separated mistakes tag string. */
export type TradeWithMistakes = StatsTrade & { mistakes?: string | null };

export type MistakeLedgerRow = {
  label: string;
  pnl: number; // net P&L across trades carrying this tag (usually negative)
  count: number;
};

/**
 * What each mistake cost you: net P&L of the closed trades carrying each tag,
 * sorted most-expensive first. A trade tagged with several mistakes counts
 * toward each of them.
 */
export function mistakeLedger(trades: TradeWithMistakes[]): MistakeLedgerRow[] {
  // closedTrades keeps every field at runtime; re-attach the type.
  const closed = closedTrades(trades) as (ReturnType<typeof closedTrades>[number] & { mistakes?: string | null })[];
  const byTag = new Map<string, { pnl: number; count: number }>();
  for (const t of closed) {
    const tags = (t.mistakes ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const tag of tags) {
      const b = byTag.get(tag) ?? { pnl: 0, count: 0 };
      b.pnl += t.pnl;
      b.count += 1;
      byTag.set(tag, b);
    }
  }
  return [...byTag.entries()]
    .map(([label, { pnl, count }]) => ({ label, pnl, count }))
    .sort((a, b) => a.pnl - b.pnl); // most negative (costliest) first
}
