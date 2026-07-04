import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parseFilters, filtersToWhere } from "@/lib/filters";
import {
  computeStats,
  equityCurve,
  drawdownCurve,
  pnlByPeriod,
  pnlByGroup,
  pnlByWeekday,
  dailyPnlMap,
  closedTrades,
} from "@/lib/stats";
import { fmtMoney, fmtSignedMoney, fmtPct, fmtNum, fmtDuration, fmtDateTime } from "@/lib/format";
import { FilterBar } from "@/components/FilterBar";
import { StatTile } from "@/components/StatTile";
import { EquityCurve } from "@/components/charts/EquityCurve";
import { DrawdownChart } from "@/components/charts/DrawdownChart";
import { PeriodPnlChart } from "@/components/charts/PeriodPnlChart";
import { GroupPnlChart } from "@/components/charts/GroupPnlChart";
import { WeekdayPnlChart } from "@/components/charts/WeekdayPnlChart";
import { CalendarHeatmap } from "@/components/charts/CalendarHeatmap";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard — TradeLog" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseFilters(await searchParams);
  const where = filtersToWhere(filters);

  const [settings, trades, symbolRows, strategyRows] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.trade.findMany({ where, orderBy: { entryDate: "asc" } }),
    prisma.trade.findMany({ distinct: ["symbol"], select: { symbol: true }, orderBy: { symbol: "asc" } }),
    prisma.trade.findMany({ distinct: ["strategy"], select: { strategy: true }, where: { strategy: { not: null } } }),
  ]);

  const currency = settings?.currency ?? "USD";
  const startingBalance = settings?.startingBalance ?? 10000;

  const stats = computeStats(trades, startingBalance);
  const curve = equityCurve(trades, startingBalance);
  const ddCurve = drawdownCurve(trades, startingBalance);
  const periodData = {
    day: pnlByPeriod(trades, "day"),
    week: pnlByPeriod(trades, "week"),
    month: pnlByPeriod(trades, "month"),
  };
  const bySymbol = pnlByGroup(trades, "symbol");
  const byStrategy = pnlByGroup(trades, "strategy");
  const byWeekday = pnlByWeekday(trades);
  const daily = dailyPnlMap(trades);

  const returnPct = startingBalance > 0 ? stats.totalPnl / startingBalance : null;
  const recent = closedTrades(trades).slice(-6).reverse();
  const open = trades.filter((t) => t.exitPrice == null);

  const tone = (v: number | null | undefined) =>
    v == null || v === 0 ? ("neutral" as const) : v > 0 ? ("positive" as const) : ("negative" as const);

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-sm font-medium text-muted">Net P&L</h1>
          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            <p className={`text-4xl font-bold tracking-tight sm:text-5xl ${stats.totalPnl >= 0 ? "text-profit" : "text-loss"}`}>
              {fmtSignedMoney(stats.totalPnl, currency)}
            </p>
            {returnPct != null && (
              <span
                className={`rounded-full px-2.5 py-1 text-sm font-semibold ${
                  returnPct >= 0 ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
                }`}
              >
                {returnPct >= 0 ? "▲" : "▼"} {fmtPct(Math.abs(returnPct))}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            on {fmtMoney(startingBalance, currency)} starting balance · {fmtMoney(stats.totalFees, currency)} paid in fees
          </p>
        </div>
        <p className="text-sm text-muted">
          {stats.closedCount} closed · {stats.openCount} open · {stats.tradeCount} total in view
        </p>
      </div>

      <FilterBar
        symbols={symbolRows.map((r) => r.symbol)}
        strategies={strategyRows.map((r) => r.strategy!).sort()}
      />

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile
          label="Win rate"
          value={stats.winRate == null ? "—" : fmtPct(stats.winRate)}
          sub={`${stats.closedCount} closed trades`}
        />
        <StatTile
          label="Profit factor"
          value={
            stats.profitFactor == null ? "—" : stats.profitFactor === Infinity ? "∞" : fmtNum(stats.profitFactor)
          }
          sub="gross wins ÷ gross losses"
        />
        <StatTile
          label="Expectancy"
          value={stats.expectancy == null ? "—" : fmtSignedMoney(stats.expectancy, currency)}
          sub="average P&L per trade"
          tone={tone(stats.expectancy)}
        />
        <StatTile
          label="Max drawdown"
          value={fmtMoney(stats.maxDrawdown, currency)}
          sub="peak-to-trough on equity"
          tone={stats.maxDrawdown > 0 ? "negative" : "neutral"}
        />
        <StatTile
          label="Average win / loss"
          value={
            stats.avgWin == null && stats.avgLoss == null
              ? "—"
              : `${stats.avgWin == null ? "—" : fmtMoney(stats.avgWin, currency)} / ${stats.avgLoss == null ? "—" : fmtMoney(stats.avgLoss, currency)}`
          }
          sub={
            stats.avgWin != null && stats.avgLoss != null && stats.avgLoss > 0
              ? `${fmtNum(stats.avgWin / stats.avgLoss)}R reward-to-risk`
              : undefined
          }
        />
        <StatTile
          label="Best / worst trade"
          value={stats.bestTrade ? fmtSignedMoney(stats.bestTrade.pnl, currency) : "—"}
          sub={
            stats.bestTrade && stats.worstTrade
              ? `${stats.bestTrade.symbol} · worst ${fmtSignedMoney(stats.worstTrade.pnl, currency)} (${stats.worstTrade.symbol})`
              : undefined
          }
          tone={tone(stats.bestTrade?.pnl)}
        />
        <StatTile
          label="Avg hold time"
          value={stats.avgHoldMs == null ? "—" : fmtDuration(stats.avgHoldMs)}
          sub="entry to exit"
        />
        <StatTile
          label="Streaks"
          value={
            stats.currentStreak === 0
              ? "—"
              : `${Math.abs(stats.currentStreak)} ${stats.currentStreak > 0 ? "win" : "loss"}${Math.abs(stats.currentStreak) > 1 ? "s" : ""}`
          }
          sub={`best ${stats.maxWinStreak} wins · worst ${stats.maxLossStreak} losses`}
          tone={tone(stats.currentStreak)}
        />
      </div>

      {/* Long vs short */}
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ["Long", stats.long, "badge-long"],
            ["Short", stats.short, "badge-short"],
          ] as const
        ).map(([label, s, badge]) => (
          <div key={label} className="card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={badge}>{label}</span>
              <span className="text-sm text-muted">
                {s.count} closed{s.winRate != null && <> · {fmtPct(s.winRate)} win rate</>}
              </span>
            </div>
            <span className={`text-lg font-semibold ${s.pnl > 0 ? "text-profit" : s.pnl < 0 ? "text-loss" : "text-ink"}`}>
              {s.count ? fmtSignedMoney(s.pnl, currency) : "—"}
            </span>
          </div>
        ))}
      </div>

      {/* Equity + drawdown */}
      <section className="card">
        <h2 className="card-title">Equity curve</h2>
        {stats.closedCount === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            No closed trades in this range — add trades or adjust the filters.
          </p>
        ) : (
          <>
            <EquityCurve points={curve} currency={currency} />
            <h2 className="card-title mt-5">Drawdown</h2>
            <DrawdownChart points={ddCurve} currency={currency} />
          </>
        )}
      </section>

      {/* P&L over time + heatmap */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <h2 className="card-title mb-1">Net P&L by period</h2>
          <PeriodPnlChart data={periodData} currency={currency} />
        </section>
        <section className="card">
          <h2 className="card-title">Daily P&L calendar</h2>
          <CalendarHeatmap daily={daily} currency={currency} />
        </section>
      </div>

      {/* Groups */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <h2 className="card-title">P&L by symbol</h2>
          <GroupPnlChart rows={bySymbol} currency={currency} />
        </section>
        <section className="card">
          <h2 className="card-title">P&L by strategy</h2>
          <GroupPnlChart rows={byStrategy} currency={currency} />
        </section>
      </div>

      {/* Weekday + activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <h2 className="card-title">P&L by weekday</h2>
          <WeekdayPnlChart rows={byWeekday} currency={currency} />
        </section>
        <section className="card">
          <h2 className="card-title">Latest activity</h2>
          {open.length > 0 && (
            <div className="mb-3 rounded-xl border border-accent/25 bg-accent/5 p-3">
              <p className="mb-2 text-xs font-semibold text-accent">Open positions ({open.length})</p>
              <div className="flex flex-wrap gap-2">
                {open.map((t) => (
                  <span key={t.id} className="rounded-lg border border-edge bg-raised px-2 py-1 text-xs">
                    <span className="font-semibold">{t.symbol}</span>{" "}
                    <span className="text-muted">
                      {t.direction === "LONG" ? "L" : "S"} · {fmtNum(t.size, 4)} @ {fmtNum(t.entryPrice, 4)}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No closed trades yet.</p>
          ) : (
            <ul className="divide-y divide-edge/60">
              {recent.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span className={t.direction === "LONG" ? "badge-long" : "badge-short"}>
                      {t.direction === "LONG" ? "L" : "S"}
                    </span>
                    <span className="font-medium">{t.symbol}</span>
                    <span className="text-xs text-muted">{fmtDateTime(t.closedAt)}</span>
                  </span>
                  <span className={`font-semibold tabular-nums ${t.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                    {fmtSignedMoney(t.pnl, currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/trades" className="mt-3 inline-block text-xs font-medium text-accent hover:underline">
            View all trades →
          </Link>
        </section>
      </div>
    </div>
  );
}
