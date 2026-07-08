import { closedTrades, type StatsTrade, type ClosedTrade } from "./stats";
import { killzone } from "./killzones";

/**
 * Pro "Edge Finder": goes past the dashboard's teaser insights — every finding
 * carries the dollar amount acting on it is worth, and the what-if simulator
 * replays the whole history under a discipline rule to show the exact P&L
 * difference. Closed trades only.
 */

export type Finding = {
  emoji: string;
  title: string;
  detail: string;
  /** Dollars acting on this is worth (kept losses / captured wins). Null = behavioral. */
  impact: number | null;
  tone: "good" | "bad";
};

export type WhatIf = {
  label: string;
  description: string;
  pnl: number;
  delta: number;
  tradesKept: number;
  tradesTotal: number;
};

const MIN = 3; // never declare an edge off one lucky trade

type Bucket = { label: string; pnl: number; count: number; wins: number };

function bucketBy(closed: ClosedTrade[], key: (t: ClosedTrade) => string): Bucket[] {
  const map = new Map<string, Bucket>();
  for (const t of closed) {
    const label = key(t);
    const b = map.get(label) ?? { label, pnl: 0, count: 0, wins: 0 };
    b.pnl += t.pnl;
    b.count += 1;
    if (t.pnl > 0) b.wins += 1;
    map.set(label, b);
  }
  return [...map.values()];
}

const weekdayName = (t: ClosedTrade): string =>
  ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][t.closedAt.getUTCDay()];

/** Closed trades grouped per day, in close order. */
function byDay(closed: ClosedTrade[]): Map<string, ClosedTrade[]> {
  const days = new Map<string, ClosedTrade[]>();
  for (const t of closed) {
    const key = t.closedAt.toISOString().slice(0, 10);
    const arr = days.get(key) ?? [];
    arr.push(t);
    days.set(key, arr);
  }
  return days;
}

export function edgeFindings(trades: StatsTrade[]): Finding[] {
  const closed = closedTrades(trades);
  const findings: Finding[] = [];
  if (closed.length < MIN * 2) return findings;

  const pct = (b: Bucket) => Math.round((b.wins / b.count) * 100);

  // --- Where the edge lives (and leaks): killzone / weekday / symbol ---
  const dimensions: { name: string; buckets: Bucket[]; bestNote: string; worstNote: string }[] = [
    {
      name: "killzone",
      buckets: bucketBy(closed, (t) => killzone(t.entryDate)),
      bestNote: "This window is your real edge — be there every day, and be pickier everywhere else.",
      worstNote: "Sitting out this window entirely would have kept this in the account.",
    },
    {
      name: "weekday",
      buckets: bucketBy(closed, weekdayName),
      bestNote: "Your best day of the week — guard the routine that produces it.",
      worstNote: "Making this a no-trade day would have kept this in the account.",
    },
    {
      name: "symbol",
      buckets: bucketBy(closed, (t) => t.symbol),
      bestNote: "This market pays you — it deserves most of your screen time.",
      worstNote: "Dropping this symbol until you find out why would have kept this in the account.",
    },
  ];
  for (const dim of dimensions) {
    const solid = dim.buckets.filter((b) => b.count >= MIN);
    if (solid.length < 2) continue;
    const best = solid.reduce((a, b) => (b.pnl > a.pnl ? b : a));
    const worst = solid.reduce((a, b) => (b.pnl < a.pnl ? b : a));
    if (best.pnl > 0) {
      findings.push({
        emoji: "🎯",
        title: `Your money ${dim.name}: ${best.label}`,
        detail: `${best.count} trades, ${pct(best)}% win rate. ${dim.bestNote}`,
        impact: best.pnl,
        tone: "good",
      });
    }
    if (worst.pnl < 0) {
      findings.push({
        emoji: "✂️",
        title: `Leaking ${dim.name}: ${worst.label}`,
        detail: `${worst.count} trades, ${pct(worst)}% win rate. ${dim.worstNote}`,
        impact: -worst.pnl,
        tone: "bad",
      });
    }
  }

  // --- Overtrading: trades after the 3rd of the day ---
  const days = byDay(closed);
  let latePnl = 0;
  let lateCount = 0;
  for (const dayTrades of days.values()) {
    dayTrades.forEach((t, i) => {
      if (i >= 3) {
        latePnl += t.pnl;
        lateCount += 1;
      }
    });
  }
  if (lateCount >= MIN && latePnl < 0) {
    findings.push({
      emoji: "🛑",
      title: "Overtrading is expensive",
      detail: `Everything after your 3rd trade of the day nets out negative (${lateCount} trades). A hard daily stop after 3 would have saved this.`,
      impact: -latePnl,
      tone: "bad",
    });
  }

  // --- Revenge trading: entries within 30 minutes of a losing close ---
  let revengePnl = 0;
  let revengeCount = 0;
  let revengeWins = 0;
  for (const dayTrades of days.values()) {
    for (let i = 1; i < dayTrades.length; i++) {
      const prev = dayTrades[i - 1];
      const cur = dayTrades[i];
      const gap = cur.entryDate.getTime() - prev.closedAt.getTime();
      if (prev.pnl < 0 && gap >= 0 && gap < 30 * 60_000) {
        revengePnl += cur.pnl;
        revengeCount += 1;
        if (cur.pnl > 0) revengeWins += 1;
      }
    }
  }
  if (revengeCount >= MIN && revengePnl < 0) {
    findings.push({
      emoji: "😤",
      title: "Revenge trades are bleeding you",
      detail: `${revengeCount} re-entries within 30 minutes of a loss, ${Math.round((revengeWins / revengeCount) * 100)}% win rate. A 30-minute cooldown rule is worth real money.`,
      impact: -revengePnl,
      tone: "bad",
    });
  }

  // --- Hold-time asymmetry: riding losers, cutting winners ---
  const winners = closed.filter((t) => t.pnl > 0);
  const losers = closed.filter((t) => t.pnl < 0);
  const avgHold = (arr: ClosedTrade[]) =>
    arr.length ? arr.reduce((s, t) => s + Math.max(0, t.closedAt.getTime() - t.entryDate.getTime()), 0) / arr.length : 0;
  const winHold = avgHold(winners);
  const lossHold = avgHold(losers);
  if (winners.length >= MIN && losers.length >= MIN && winHold > 0 && lossHold > 0) {
    const ratio = lossHold / winHold;
    if (ratio >= 1.5) {
      findings.push({
        emoji: "⏳",
        title: `Losers get ${ratio.toFixed(1)}× more time than winners`,
        detail: "Hope-mode detected: winners get cut early, losers get room to 'come back'. Respect the invalidation — the market doesn't owe the trade.",
        impact: null,
        tone: "bad",
      });
    } else if (ratio <= 0.67) {
      findings.push({
        emoji: "⚡",
        title: "You cut losers fast and let winners breathe",
        detail: `Losing trades get closed ${(1 / ratio).toFixed(1)}× faster than winners — exactly the asymmetry that compounds.`,
        impact: null,
        tone: "good",
      });
    }
  }

  // Biggest dollar leaks first; behavioral notes last.
  return findings.sort((a, b) => (b.impact ?? -1) - (a.impact ?? -1)).slice(0, 8);
}

export function whatIfScenarios(trades: StatsTrade[]): WhatIf[] {
  const closed = closedTrades(trades);
  if (closed.length < MIN * 2) return [];
  const actual = closed.reduce((s, t) => s + t.pnl, 0);
  const out: WhatIf[] = [];
  const add = (label: string, description: string, kept: ClosedTrade[]) => {
    const pnl = kept.reduce((s, t) => s + t.pnl, 0);
    out.push({ label, description, pnl, delta: pnl - actual, tradesKept: kept.length, tradesTotal: closed.length });
  };

  const worstOf = (buckets: Bucket[]) => {
    const solid = buckets.filter((b) => b.count >= MIN && b.pnl < 0);
    return solid.length ? solid.reduce((a, b) => (b.pnl < a.pnl ? b : a)) : null;
  };

  const worstSymbol = worstOf(bucketBy(closed, (t) => t.symbol));
  if (worstSymbol) {
    add(`Skip ${worstSymbol.label}`, "Drop your worst symbol entirely", closed.filter((t) => t.symbol !== worstSymbol.label));
  }

  const worstDay = worstOf(bucketBy(closed, weekdayName));
  if (worstDay) {
    add(`Skip ${worstDay.label}s`, "Take your worst weekday off", closed.filter((t) => weekdayName(t) !== worstDay.label));
  }

  // Discipline rule: stop after 2 losses a day.
  const kept: ClosedTrade[] = [];
  for (const dayTrades of byDay(closed).values()) {
    let losses = 0;
    for (const t of dayTrades) {
      if (losses >= 2) continue;
      kept.push(t);
      if (t.pnl < 0) losses += 1;
    }
  }
  if (kept.length < closed.length) add("Stop after 2 losses/day", "Walk away once the day turns against you", kept);

  // Focus rule: only the best killzone.
  const kz = bucketBy(closed, (t) => killzone(t.entryDate)).filter((b) => b.count >= MIN);
  if (kz.length >= 2) {
    const best = kz.reduce((a, b) => (b.pnl > a.pnl ? b : a));
    if (best.pnl > 0) {
      add(`Only trade ${best.label}`, "Nothing outside your best killzone", closed.filter((t) => killzone(t.entryDate) === best.label));
    }
  }

  // Discipline rule: max 3 trades a day.
  const capped: ClosedTrade[] = [];
  for (const dayTrades of byDay(closed).values()) capped.push(...dayTrades.slice(0, 3));
  if (capped.length < closed.length) add("Max 3 trades/day", "Hard cap — quality over quantity", capped);

  return out.sort((a, b) => b.delta - a.delta).slice(0, 5);
}
