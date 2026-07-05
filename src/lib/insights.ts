import { closedTrades, type StatsTrade } from "./stats";
import { killzone } from "./killzones";

export type Insight = {
  emoji: string;
  text: string;
  tone: "good" | "bad" | "info";
};

const fmt = (n: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(Math.abs(n));

/**
 * Rule-based pattern detection over the user's closed trades. Every insight
 * has minimum-sample thresholds so we never spam noise from 2 trades.
 */
export function computeInsights(trades: StatsTrade[], currency: string): Insight[] {
  const closed = closedTrades(trades);
  const out: Insight[] = [];
  if (closed.length < 10) return out;

  // 1. Best killzone (>=3 trades there, positive)
  const byKz = new Map<string, { pnl: number; n: number }>();
  for (const t of closed) {
    const k = killzone(t.entryDate);
    const cur = byKz.get(k) ?? { pnl: 0, n: 0 };
    byKz.set(k, { pnl: cur.pnl + t.pnl, n: cur.n + 1 });
  }
  const kzRanked = [...byKz.entries()].filter(([, v]) => v.n >= 3).sort((a, b) => b[1].pnl - a[1].pnl);
  if (kzRanked.length >= 2 && kzRanked[0][1].pnl > 0) {
    const [name, v] = kzRanked[0];
    out.push({
      emoji: "🎯",
      tone: "good",
      text: `Your edge lives in the ${name}: ${fmt(v.pnl, currency)} profit across ${v.n} trades. Protect that window.`,
    });
    const worstKz = kzRanked[kzRanked.length - 1];
    if (worstKz[1].pnl < 0 && worstKz[1].n >= 3) {
      out.push({
        emoji: "🚫",
        tone: "bad",
        text: `The ${worstKz[0]} is bleeding you: ${fmt(worstKz[1].pnl, currency)} lost in ${worstKz[1].n} trades. What if you just… didn't trade it?`,
      });
    }
  }

  // 2. Revenge trading: entries within 30 minutes after a loss
  let revengeWins = 0,
    revengeN = 0,
    winsTotal = 0;
  for (let i = 0; i < closed.length; i++) {
    if (closed[i].pnl > 0) winsTotal++;
    if (i === 0) continue;
    const prev = closed[i - 1];
    const gapMin = (closed[i].entryDate.getTime() - prev.closedAt.getTime()) / 60000;
    if (prev.pnl < 0 && gapMin >= 0 && gapMin <= 30) {
      revengeN++;
      if (closed[i].pnl > 0) revengeWins++;
    }
  }
  const overallWr = winsTotal / closed.length;
  if (revengeN >= 5) {
    const revengeWr = revengeWins / revengeN;
    if (revengeWr < overallWr - 0.12) {
      out.push({
        emoji: "🔥",
        tone: "bad",
        text: `Revenge alert: trades taken within 30 minutes of a loss win only ${Math.round(revengeWr * 100)}% vs your usual ${Math.round(overallWr * 100)}%. A 30-minute cooldown is free money.`,
      });
    }
  }

  // 3. Overtrading: heavy days vs light days
  const byDay = new Map<string, { pnl: number; n: number }>();
  for (const t of closed) {
    const d = t.closedAt.toISOString().slice(0, 10);
    const cur = byDay.get(d) ?? { pnl: 0, n: 0 };
    byDay.set(d, { pnl: cur.pnl + t.pnl, n: cur.n + 1 });
  }
  const days = [...byDay.values()];
  const heavy = days.filter((d) => d.n >= 4);
  const light = days.filter((d) => d.n <= 3 && d.n > 0);
  if (heavy.length >= 3 && light.length >= 3) {
    const avgHeavy = heavy.reduce((s, d) => s + d.pnl, 0) / heavy.length;
    const avgLight = light.reduce((s, d) => s + d.pnl, 0) / light.length;
    if (avgHeavy < 0 && avgLight > avgHeavy) {
      out.push({
        emoji: "🧯",
        tone: "bad",
        text: `Days with 4+ trades average ${fmt(avgHeavy, currency)} — days with 1-3 trades average ${avgLight >= 0 ? "+" : "-"}${fmt(avgLight, currency)}. Fewer bullets, better aim.`,
      });
    }
  }

  // 4. Direction bias
  const longs = closed.filter((t) => t.direction === "LONG");
  const shorts = closed.filter((t) => t.direction === "SHORT");
  if (longs.length >= 5 && shorts.length >= 5) {
    const lp = longs.reduce((s, t) => s + t.pnl, 0);
    const sp = shorts.reduce((s, t) => s + t.pnl, 0);
    if (lp > 0 && sp < 0) {
      out.push({
        emoji: "🧭",
        tone: "info",
        text: `You're a better bull than bear: longs made ${fmt(lp, currency)}, shorts lost ${fmt(sp, currency)}. Demand extra confluence before shorting.`,
      });
    } else if (sp > 0 && lp < 0) {
      out.push({
        emoji: "🧭",
        tone: "info",
        text: `You're a better bear than bull: shorts made ${fmt(sp, currency)}, longs lost ${fmt(lp, currency)}. Demand extra confluence before buying.`,
      });
    }
  }

  // 5. Best symbol vs worst symbol
  const bySym = new Map<string, { pnl: number; n: number }>();
  for (const t of closed) {
    const cur = bySym.get(t.symbol) ?? { pnl: 0, n: 0 };
    bySym.set(t.symbol, { pnl: cur.pnl + t.pnl, n: cur.n + 1 });
  }
  const symRanked = [...bySym.entries()].filter(([, v]) => v.n >= 3).sort((a, b) => b[1].pnl - a[1].pnl);
  if (symRanked.length >= 2) {
    const worst = symRanked[symRanked.length - 1];
    if (worst[1].pnl < 0) {
      out.push({
        emoji: "📉",
        tone: "bad",
        text: `${worst[0]} owes you money: ${fmt(worst[1].pnl, currency)} down over ${worst[1].n} trades. Either journal why — or divorce it.`,
      });
    }
  }

  return out.slice(0, 4);
}
