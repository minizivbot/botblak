import { closedTrades, type StatsTrade } from "./stats";
import { dailyGrades } from "./discipline";
import { etDateOf } from "./trading-day";

/**
 * The Edge Score: one honest number (0–100) for the quality of your trading,
 * built from four sub-scores — payoff, consistency, discipline and risk.
 * Inspired by what the premium journals charge $49/mo for.
 */

export type EdgeSub = { label: string; score: number; detail: string };
export type Edge = {
  score: number;
  subs: EdgeSub[];
  strength: string;
  weakness: string;
};

export function computeEdge(trades: StatsTrade[], startingBalance: number, maxDailyLoss: number | null): Edge | null {
  const closed = closedTrades(trades);
  if (closed.length < 3) return null; // not enough data to say anything honest

  // 1. Payoff — profit factor, mapped so 2.0+ is elite.
  const grossWin = closed.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(closed.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  const pf = grossLoss === 0 ? 3 : grossWin / grossLoss;
  const payoff = Math.round(Math.max(0, Math.min(100, pf * 50)));

  // 2. Consistency — share of green trading days.
  const byDay = new Map<string, number>();
  for (const t of closed) byDay.set(etDateOf(t.closedAt), (byDay.get(etDateOf(t.closedAt)) ?? 0) + t.pnl);
  const days = [...byDay.values()];
  const greenRate = days.filter((p) => p > 0).length / days.length;
  const consistency = Math.round(greenRate * 100);

  // 3. Discipline — average of the last 10 session grades.
  const grades = dailyGrades(trades, maxDailyLoss).slice(0, 10);
  const discipline = grades.length ? Math.round(grades.reduce((s, g) => s + g.score, 0) / grades.length) : 50;

  // 4. Risk — peak-to-trough drawdown as a share of the account; 2% or less is elite.
  let peak = startingBalance;
  let equity = startingBalance;
  let maxDd = 0;
  for (const t of closed) {
    equity += t.pnl;
    peak = Math.max(peak, equity);
    maxDd = Math.max(maxDd, peak - equity);
  }
  const ddPct = startingBalance > 0 ? (maxDd / startingBalance) * 100 : 0;
  const risk = Math.round(Math.max(0, Math.min(100, 100 - (ddPct - 2) * 12.5)));

  const subs: EdgeSub[] = [
    { label: "Payoff", score: payoff, detail: `profit factor ${pf === 3 && grossLoss === 0 ? "∞" : pf.toFixed(2)}` },
    { label: "Consistency", score: consistency, detail: `${days.filter((p) => p > 0).length}/${days.length} green days` },
    { label: "Discipline", score: discipline, detail: "last 10 sessions" },
    { label: "Risk", score: risk, detail: `${ddPct.toFixed(1)}% max drawdown` },
  ];

  const score = Math.round(payoff * 0.3 + consistency * 0.25 + discipline * 0.25 + risk * 0.2);
  const sorted = [...subs].sort((a, b) => b.score - a.score);
  return { score, subs, strength: sorted[0].label, weakness: sorted[sorted.length - 1].label };
}
