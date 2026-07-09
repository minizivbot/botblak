import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./prisma";
import { closedTrades, computeStats, pnlByGroup, pnlByKillzone, pnlByWeekday, type StatsTrade } from "./stats";
import { fmtSignedMoney, fmtMoney, fmtPct } from "./format";

/** AI coach is live once the owner sets ANTHROPIC_API_KEY in the environment. */
export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const SYSTEM = `You are the personal trading coach inside TradeZone, a futures trading journal used by ICT-style day traders (killzones, FVGs, liquidity, prop-firm challenges).

You are given a statistical digest of one trader's last 30 days. Write their coaching review.

Rules:
- Talk directly to the trader ("you"), like a sharp coach who has watched every trade. Be honest — praise what the numbers earn, call out what they don't. Never invent numbers that aren't in the digest.
- Structure: start with a one-line verdict of the month. Then 2-4 specific observations grounded in the data (their best edge, their biggest leak, a behavioral pattern). End with exactly ONE "this week, do this" instruction — the single highest-impact change.
- Reference concrete numbers from the digest so it feels personal, and translate them into behavior ("your NY AM win rate says show up at 7am prepared, not scrolling").
- 250-400 words. Plain paragraphs and short bullet lists only — no headers, no tables, no markdown syntax beyond "-" bullets.
- If the sample is thin (under ~10 closed trades), say so and coach on process instead of statistics.
- Never give financial advice on what market will do — coach the trader's process only.`;

function digest(trades: StatsTrade[], currency: string): string {
  const closed = closedTrades(trades);
  const stats = computeStats(trades, 0);
  const lines: string[] = [];

  lines.push(`Last 30 days: ${closed.length} closed trades, net P&L ${fmtSignedMoney(stats.totalPnl, currency)}.`);
  if (stats.winRate != null) lines.push(`Win rate ${fmtPct(stats.winRate)}; avg win ${stats.avgWin != null ? fmtMoney(stats.avgWin, currency) : "n/a"}, avg loss ${stats.avgLoss != null ? fmtMoney(stats.avgLoss, currency) : "n/a"}.`);
  if (stats.profitFactor != null && stats.profitFactor !== Infinity) lines.push(`Profit factor ${stats.profitFactor.toFixed(2)}.`);
  lines.push(`Longs: ${stats.long.count} trades, ${fmtSignedMoney(stats.long.pnl, currency)}. Shorts: ${stats.short.count} trades, ${fmtSignedMoney(stats.short.pnl, currency)}.`);
  lines.push(`Max win streak ${stats.maxWinStreak}, max loss streak ${stats.maxLossStreak}. Fees paid: ${fmtMoney(stats.totalFees, currency)}.`);

  const kz = pnlByKillzone(trades);
  if (kz.length) lines.push(`By killzone: ${kz.map((k) => `${k.label} ${fmtSignedMoney(k.pnl, currency)} (${k.count})`).join("; ")}.`);
  const wd = pnlByWeekday(trades).filter((w) => w.count > 0);
  if (wd.length) lines.push(`By weekday: ${wd.map((w) => `${w.label} ${fmtSignedMoney(w.pnl, currency)} (${w.count})`).join("; ")}.`);
  const sym = pnlByGroup(trades, "symbol").slice(0, 6);
  if (sym.length) lines.push(`By symbol: ${sym.map((s) => `${s.label} ${fmtSignedMoney(s.pnl, currency)} (${s.count})`).join("; ")}.`);
  const setup = pnlByGroup(trades, "strategy").slice(0, 6);
  if (setup.length) lines.push(`By tagged setup: ${setup.map((s) => `${s.label} ${fmtSignedMoney(s.pnl, currency)} (${s.count})`).join("; ")}.`);

  // Daily P&L series — lets the coach spot revenge days and streaks itself.
  const dayMap = new Map<string, number>();
  for (const t of closed) {
    const key = t.closedAt.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + t.pnl);
  }
  const days = [...dayMap.entries()].sort(([a], [b]) => a.localeCompare(b));
  if (days.length) lines.push(`Daily P&L: ${days.map(([d, p]) => `${d.slice(5)}: ${Math.round(p)}`).join(", ")}.`);

  return lines.join("\n");
}

/**
 * Generate and persist a coaching review of the user's last 30 days.
 * Throws Anthropic SDK errors — the API route maps them to friendly messages.
 */
export async function generateCoachReview(userId: string): Promise<string> {
  const [trades, settings] = await Promise.all([
    prisma.trade.findMany({ where: { userId, exitDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
    prisma.settings.findUnique({ where: { userId } }),
  ]);
  const currency = settings?.currency ?? "USD";

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    system: SYSTEM,
    messages: [{ role: "user", content: `Here is my trading digest:\n\n${digest(trades as StatsTrade[], currency)}` }],
  });

  const body = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!body) throw new Error("Empty coach response");

  await prisma.aiReport.create({ data: { userId, body } });
  return body;
}
