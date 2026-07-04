import { prisma } from "@/lib/prisma";
import { parseFilters, filtersToWhere } from "@/lib/filters";
import {
  computeStats,
  equityCurve,
  pnlByPeriod,
  pnlByGroup,
  dailyPnlMap,
} from "@/lib/stats";
import { fmtMoney, fmtSignedMoney, fmtPct, fmtNum } from "@/lib/format";
import { FilterBar } from "@/components/FilterBar";
import { StatTile } from "@/components/StatTile";
import { EquityCurve } from "@/components/charts/EquityCurve";
import { PeriodPnlChart } from "@/components/charts/PeriodPnlChart";
import { GroupPnlChart } from "@/components/charts/GroupPnlChart";
import { CalendarHeatmap } from "@/components/charts/CalendarHeatmap";

export const dynamic = "force-dynamic";

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
  const periodData = {
    day: pnlByPeriod(trades, "day"),
    week: pnlByPeriod(trades, "week"),
    month: pnlByPeriod(trades, "month"),
  };
  const bySymbol = pnlByGroup(trades, "symbol");
  const byStrategy = pnlByGroup(trades, "strategy");
  const daily = dailyPnlMap(trades);

  const tone = (v: number | null | undefined) =>
    v == null || v === 0 ? ("neutral" as const) : v > 0 ? ("positive" as const) : ("negative" as const);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted">
          {stats.closedCount} closed / {stats.tradeCount} total trades in view
        </p>
      </div>

      <FilterBar
        symbols={symbolRows.map((r) => r.symbol)}
        strategies={strategyRows.map((r) => r.strategy!).sort()}
      />

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile
          label="Total P&L"
          value={fmtSignedMoney(stats.totalPnl, currency)}
          sub={`on ${fmtMoney(startingBalance, currency)} starting balance`}
          tone={tone(stats.totalPnl)}
        />
        <StatTile
          label="Win rate"
          value={stats.winRate == null ? "—" : fmtPct(stats.winRate)}
          sub={`${stats.closedCount} closed trades`}
        />
        <StatTile
          label="Profit factor"
          value={
            stats.profitFactor == null
              ? "—"
              : stats.profitFactor === Infinity
                ? "∞"
                : fmtNum(stats.profitFactor)
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
          label="Average win"
          value={stats.avgWin == null ? "—" : fmtMoney(stats.avgWin, currency)}
          tone="positive"
        />
        <StatTile
          label="Average loss"
          value={stats.avgLoss == null ? "—" : fmtMoney(stats.avgLoss, currency)}
          tone={stats.avgLoss == null ? "neutral" : "negative"}
        />
        <StatTile
          label="Max drawdown"
          value={fmtMoney(stats.maxDrawdown, currency)}
          sub="peak-to-trough on equity"
          tone={stats.maxDrawdown > 0 ? "negative" : "neutral"}
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
      </div>

      {/* Equity curve */}
      <section className="card">
        <h2 className="mb-3 text-sm font-semibold text-ink-2">Equity curve</h2>
        {stats.closedCount === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            No closed trades in this range — add trades or adjust the filters.
          </p>
        ) : (
          <EquityCurve points={curve} currency={currency} />
        )}
      </section>

      {/* P&L over time + heatmap */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-1 text-sm font-semibold text-ink-2">Net P&L by period</h2>
          <PeriodPnlChart data={periodData} currency={currency} />
        </section>
        <section className="card">
          <h2 className="mb-3 text-sm font-semibold text-ink-2">Daily P&L calendar</h2>
          <CalendarHeatmap daily={daily} currency={currency} />
        </section>
      </div>

      {/* Groups */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-3 text-sm font-semibold text-ink-2">P&L by symbol</h2>
          <GroupPnlChart rows={bySymbol} currency={currency} />
        </section>
        <section className="card">
          <h2 className="mb-3 text-sm font-semibold text-ink-2">P&L by strategy</h2>
          <GroupPnlChart rows={byStrategy} currency={currency} />
        </section>
      </div>
    </div>
  );
}
