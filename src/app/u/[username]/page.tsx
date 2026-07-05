import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import {
  computeStats,
  equityCurve,
  pnlByKillzone,
  pnlByConcept,
  type StatsTrade,
} from "@/lib/stats";
import { fmtMoney, fmtSignedMoney, fmtPct, fmtNum } from "@/lib/format";
import { StatTile } from "@/components/StatTile";
import { EquityCurve } from "@/components/charts/EquityCurve";
import { GroupPnlChart } from "@/components/charts/GroupPnlChart";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return { title: `${decodeURIComponent(username)} — Trader` };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username: raw } = await params;
  const username = decodeURIComponent(raw);
  const viewer = await getViewer();

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      username: true,
      createdAt: true,
      settings: { select: { currency: true, startingBalance: true, showOnLeaderboard: true } },
      accounts: { select: { propFunded: true } },
      trades: {
        select: { id: true, symbol: true, direction: true, entryPrice: true, exitPrice: true, size: true, fees: true, entryDate: true, exitDate: true, strategy: true, concepts: true, source: true },
      },
    },
  });

  if (!user) notFound();

  const isYou = viewer.username === user.username;
  // Respect the leaderboard opt-out for other people's profiles.
  if (user.settings?.showOnLeaderboard === false && !isYou) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="card text-center">
          <p className="text-4xl">🔒</p>
          <h1 className="mt-2 text-lg font-semibold">{user.username}</h1>
          <p className="mt-1 text-sm text-muted">This trader keeps their stats private.</p>
          <Link href="/leaderboard" className="btn-ghost mt-4 inline-block">← Back to leaderboard</Link>
        </div>
      </div>
    );
  }

  const currency = user.settings?.currency ?? "USD";
  const startBalance = user.settings?.startingBalance ?? 0;
  const trades = user.trades as StatsTrade[];
  const stats = computeStats(trades, startBalance || 0);
  const curve = equityCurve(trades, startBalance || 10000);
  const byKillzone = pnlByKillzone(trades);
  const byConcept = pnlByConcept(trades);
  const verified = user.trades.some((t) => t.source === "alpaca" || t.source === "tradovate");
  const funded = user.accounts.some((a) => a.propFunded);
  const topKz = byKillzone.slice().sort((a, b) => b.pnl - a.pnl)[0];
  const initial = user.username[0]?.toUpperCase() ?? "?";

  const tone = (v: number | null | undefined) =>
    v == null || v === 0 ? ("neutral" as const) : v > 0 ? ("positive" as const) : ("negative" as const);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link href="/leaderboard" className="text-sm text-muted hover:text-ink">← Leaderboard</Link>

      {/* Header */}
      <div className="card flex flex-wrap items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-profit-mark text-2xl font-bold text-white">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{user.username}</h1>
            {isYou && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">you</span>}
            {verified ? (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">✓ Verified</span>
            ) : (
              <span className="rounded-full bg-raised px-2 py-0.5 text-xs font-medium text-muted">self-reported</span>
            )}
            {funded && <span className="rounded-full bg-profit/15 px-2 py-0.5 text-xs font-bold text-profit">FUNDED ✓</span>}
          </div>
          <p className="mt-1 text-sm text-muted">
            {stats.closedCount} closed trades · trading since {user.createdAt.toISOString().slice(0, 10)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Net P&L</p>
          <p className={`text-2xl font-bold ${stats.totalPnl >= 0 ? "text-profit" : "text-loss"}`}>
            {fmtSignedMoney(stats.totalPnl, currency)}
          </p>
        </div>
      </div>

      {stats.closedCount === 0 ? (
        <div className="card text-center text-sm text-muted">No closed trades yet.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Win rate" value={stats.winRate == null ? "—" : fmtPct(stats.winRate)} sub={`${stats.closedCount} trades`} />
            <StatTile
              label="Profit factor"
              value={stats.profitFactor == null ? "—" : stats.profitFactor === Infinity ? "∞" : fmtNum(stats.profitFactor)}
              sub="wins ÷ losses"
            />
            <StatTile label="Expectancy" value={stats.expectancy == null ? "—" : fmtSignedMoney(stats.expectancy, currency)} sub="per trade" tone={tone(stats.expectancy)} />
            <StatTile label="Max drawdown" value={fmtMoney(stats.maxDrawdown, currency)} sub="peak to trough" tone={stats.maxDrawdown > 0 ? "negative" : "neutral"} />
            <StatTile
              label="Best trade"
              value={stats.bestTrade ? fmtSignedMoney(stats.bestTrade.pnl, currency) : "—"}
              sub={stats.bestTrade?.symbol}
              tone="positive"
            />
            <StatTile
              label="Avg win / loss"
              value={`${stats.avgWin == null ? "—" : fmtMoney(stats.avgWin, currency)} / ${stats.avgLoss == null ? "—" : fmtMoney(stats.avgLoss, currency)}`}
            />
            <StatTile
              label="Best killzone"
              value={topKz ? topKz.label.replace(" KZ", "") : "—"}
              sub={topKz ? fmtSignedMoney(topKz.pnl, currency) : undefined}
              tone={tone(topKz?.pnl)}
            />
            <StatTile
              label="Streak"
              value={
                stats.currentStreak === 0
                  ? "—"
                  : `${Math.abs(stats.currentStreak)} ${stats.currentStreak > 0 ? (Math.abs(stats.currentStreak) > 1 ? "wins" : "win") : Math.abs(stats.currentStreak) > 1 ? "losses" : "loss"}`
              }
              tone={tone(stats.currentStreak)}
            />
          </div>

          <section className="card">
            <h2 className="card-title">Equity curve</h2>
            <EquityCurve points={curve} currency={currency} />
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card">
              <h2 className="card-title">P&L by killzone</h2>
              <GroupPnlChart rows={byKillzone} currency={currency} />
            </section>
            {byConcept.length > 0 && (
              <section className="card">
                <h2 className="card-title">P&L by ICT concept</h2>
                <GroupPnlChart rows={byConcept} currency={currency} />
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}
