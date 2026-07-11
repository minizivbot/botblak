import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { ensureDefaultAccount } from "@/lib/accounts";
import { DemoBanner } from "@/components/DemoBanner";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { CountUp } from "@/components/CountUp";
import { RiskGuard } from "@/components/RiskGuard";
import { PropTracker } from "@/components/PropTracker";
import { propStatus } from "@/lib/prop";
import { KillzoneClock } from "@/components/KillzoneClock";
import { ShareButton } from "@/components/ShareButton";
import { computeInsights } from "@/lib/insights";
import { parseFilters, filtersToWhere, applyKillzoneFilter, accountWhere } from "@/lib/filters";
import {
  computeStats,
  equityCurve,
  drawdownCurve,
  pnlByPeriod,
  pnlByGroup,
  pnlByWeekday,
  pnlByKillzone,
  pnlByConcept,
  dailyPnlMap,
  closedTrades,
} from "@/lib/stats";
import { mistakeLedger } from "@/lib/mistakes";
import { dailyGrades } from "@/lib/discipline";
import { weeklyMonthlyRR } from "@/lib/rr";
import { fmtMoney, fmtSignedMoney, fmtPct, fmtNum, fmtDuration, fmtDateTime } from "@/lib/format";
import { FilterBar } from "@/components/FilterBar";
import { StatTile } from "@/components/StatTile";
import { EquityCurve } from "@/components/charts/EquityCurve";
import { DrawdownChart } from "@/components/charts/DrawdownChart";
import { DashboardBreakdowns } from "@/components/DashboardBreakdowns";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard — TradeZone" };

/** Tailwind classes for a discipline letter grade badge. */
function gradeClass(grade: string): string {
  if (grade === "A" || grade === "B") return "border-profit/50 bg-profit/10 text-profit";
  if (grade === "C") return "border-accent/50 bg-accent/10 text-accent";
  return "border-loss/50 bg-loss/10 text-loss";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId, isDemo, username } = await getViewer();
  // No session and no demo user seeded — send to login as a last resort.
  if (!userId) redirect("/login");
  if (!isDemo) await ensureDefaultAccount(userId);

  // Brand-new signed-in user with no trades yet → onboarding instead of empty charts.
  if (!isDemo) {
    const anyTrades = await prisma.trade.count({ where: { userId } });
    if (anyTrades === 0) {
      const { Onboarding } = await import("@/components/Onboarding");
      return <Onboarding username={username} />;
    }
  }

  const filters = parseFilters(await searchParams);
  const accountsFull = await prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  const accounts = accountsFull.map((a) => ({ id: a.id, name: a.name, isCopy: a.isCopy }));
  const where = { ...filtersToWhere(filters), ...accountWhere(filters, accounts), userId };

  // Prop trackers: any prop-configured account that's in the current view.
  const propAccounts = accountsFull.filter(
    (a) =>
      a.propStartBalance != null &&
      (!filters.account || filters.account === a.id || (filters.account === "copy" && a.isCopy)),
  );
  const propStatuses = await Promise.all(
    propAccounts.map(async (a) => {
      const at = await prisma.trade.findMany({
        where: { userId, accountId: a.id },
        select: { direction: true, entryPrice: true, exitPrice: true, size: true, fees: true, exitDate: true },
      });
      const status = propStatus(a, at);
      // Auto-promote a challenge to "funded" the first time it passes the
      // target without a drawdown breach.
      let funded = a.propFunded;
      if (!isDemo && !funded && status.targetReached && !status.breached) {
        await prisma.account.update({ where: { id: a.id }, data: { propFunded: true } });
        funded = true;
      }
      return { account: a, status, funded };
    }),
  );

  const [settings, tradesRaw, symbolRows, strategyRows] = await Promise.all([
    prisma.settings.findUnique({ where: { userId } }),
    prisma.trade.findMany({ where, orderBy: { entryDate: "asc" } }),
    prisma.trade.findMany({ where: { userId }, distinct: ["symbol"], select: { symbol: true }, orderBy: { symbol: "asc" } }),
    prisma.trade.findMany({ where: { userId, strategy: { not: null } }, distinct: ["strategy"], select: { strategy: true } }),
  ]);

  const trades = applyKillzoneFilter(tradesRaw, filters);
  const currency = settings?.currency ?? "USD";

  // Starting balance follows the accounts in view: each account uses its own
  // size (prop account size when set, else the global Settings balance), summed
  // across the accounts the current filter shows. Falls back to the global
  // balance when no accounts match (e.g. brand-new user).
  const globalStart = settings?.startingBalance ?? 10000;
  const accountsInView = accountsFull.filter(
    (a) => !filters.account || filters.account === a.id || (filters.account === "copy" && a.isCopy),
  );
  const summedStart = accountsInView.reduce((s, a) => s + (a.propStartBalance ?? globalStart), 0);
  const startingBalance = accountsInView.length > 0 ? summedStart : globalStart;

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
  const byKillzone = pnlByKillzone(trades);
  const byConcept = pnlByConcept(trades);
  const daily = dailyPnlMap(trades);
  const ledger = mistakeLedger(trades);
  const grades = dailyGrades(trades, settings?.maxDailyLoss ?? null);
  const rrAvg = weeklyMonthlyRR(trades as { rr?: number | null; entryDate: Date }[]);

  const returnPct = startingBalance > 0 ? stats.totalPnl / startingBalance : null;
  const recent = closedTrades(trades).slice(-6).reverse();
  const open = trades.filter((t) => t.exitPrice == null);

  // Risk guard runs on ALL of today's closed trades, ignoring the view filters —
  // a loss limit is account-wide, not per-filter.
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const todayTrades = closedTrades(
    await prisma.trade.findMany({ where: { userId, exitDate: { gte: startOfToday } } }),
  );
  const todayPnl = todayTrades.reduce((s, t) => s + t.pnl, 0);
  const insights = computeInsights(trades, currency);

  const tone = (v: number | null | undefined) =>
    v == null || v === 0 ? ("neutral" as const) : v > 0 ? ("positive" as const) : ("negative" as const);

  return (
    <div className="space-y-4">
      {isDemo && <DemoBanner />}

      {/* Hero */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-sm font-medium text-muted">Net P&L</h1>
          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            <p className={`text-4xl font-bold tracking-tight sm:text-5xl ${stats.totalPnl >= 0 ? "text-profit" : "text-loss"}`}>
              <CountUp value={stats.totalPnl} currency={currency} />
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
            on {fmtMoney(startingBalance, currency)} starting balance
            {accountsInView.length > 1 && ` (across ${accountsInView.length} accounts)`} ·{" "}
            {fmtMoney(stats.totalFees, currency)} paid in fees
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <KillzoneClock />
          <p className="text-sm text-muted">
            {stats.closedCount} closed · {stats.openCount} open · {stats.tradeCount} total in view
          </p>
          {!isDemo && stats.closedCount > 0 && (
            <ShareButton href="/api/share/stats" filename="tradezone-stats.png" label="Share my stats" className="btn-ghost text-xs" />
          )}
        </div>
      </div>

      <RiskGuard
        todayPnl={todayPnl}
        todayCount={todayTrades.length}
        maxDailyLoss={settings?.maxDailyLoss ?? null}
        currency={currency}
      />

      <AccountSwitcher accounts={accounts} />

      {propStatuses.map(({ account, status, funded }) => (
        <PropTracker
          key={account.id}
          accountName={account.name}
          currency={currency}
          status={status}
          funded={funded}
        />
      ))}

      <FilterBar
        symbols={symbolRows.map((r) => r.symbol)}
        strategies={strategyRows.map((r) => r.strategy!).sort()}
      />

      {insights.length > 0 && (
        <section className="card !border-accent/30">
          <h2 className="card-title flex items-center gap-2">
            <span>⚡</span> Insights — what your trades are telling you
          </h2>
          <ul className="space-y-2.5">
            {insights.slice(0, 3).map((ins, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span className="shrink-0">{ins.emoji}</span>
                <span className={ins.tone === "bad" ? "text-ink-2" : ins.tone === "good" ? "text-ink" : "text-ink-2"}>
                  {ins.text}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Core stats — the four numbers that matter */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
      </div>

      {/* Everything else worth knowing, one quiet line */}
      {stats.closedCount > 0 && (
        <div className="card flex flex-wrap items-center gap-x-6 gap-y-2 !py-3 text-sm">
          {[
            [
              "Avg win / loss",
              stats.avgWin == null && stats.avgLoss == null
                ? null
                : `${stats.avgWin == null ? "—" : fmtMoney(stats.avgWin, currency)} / ${stats.avgLoss == null ? "—" : fmtMoney(stats.avgLoss, currency)}`,
            ],
            ["Avg R:R (week)", rrAvg.week == null ? null : `${rrAvg.week.toFixed(2)}R`],
            ["Avg R:R (month)", rrAvg.month == null ? null : `${rrAvg.month.toFixed(2)}R`],
            ["Hold time", stats.avgHoldMs == null ? null : fmtDuration(stats.avgHoldMs)],
            ["Best", stats.bestTrade ? `${fmtSignedMoney(stats.bestTrade.pnl, currency)} (${stats.bestTrade.symbol})` : null],
            ["Worst", stats.worstTrade ? `${fmtSignedMoney(stats.worstTrade.pnl, currency)} (${stats.worstTrade.symbol})` : null],
            ["Long", stats.long.count ? fmtSignedMoney(stats.long.pnl, currency) : null],
            ["Short", stats.short.count ? fmtSignedMoney(stats.short.pnl, currency) : null],
            [
              "Streak",
              stats.currentStreak === 0
                ? null
                : `${Math.abs(stats.currentStreak)} ${stats.currentStreak > 0 ? "win" : "loss"}${Math.abs(stats.currentStreak) > 1 ? "s" : ""}`,
            ],
          ]
            .filter(([, v]) => v != null)
            .map(([label, value]) => (
              <span key={label as string} className="whitespace-nowrap">
                <span className="text-xs text-muted">{label}</span>{" "}
                <span className="font-semibold text-ink-2">{value}</span>
              </span>
            ))}
        </div>
      )}

      {/* Discipline + mistakes, side by side */}
      {(grades.length > 0 || ledger.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {grades.length > 0 && (
            <section className="card">
              <h2 className="card-title">Discipline score</h2>
              <div className="flex items-center gap-3">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-2xl font-bold ${gradeClass(grades[0].grade)}`}>
                  {grades[0].grade}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{grades[0].date} · {grades[0].score}/100</p>
                  {grades[0].reasons.length === 0 ? (
                    <p className="text-xs text-profit">Clean session — followed your plan.</p>
                  ) : (
                    <p className="truncate text-xs text-loss">{grades[0].reasons.join(" · ")}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {grades.slice(0, 10).map((g) => (
                  <span
                    key={g.date}
                    title={`${g.date} · ${g.score}/100${g.reasons.length ? " · " + g.reasons.join(", ") : " · clean"}`}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-bold ${gradeClass(g.grade)}`}
                  >
                    {g.grade}
                  </span>
                ))}
              </div>
            </section>
          )}
          {ledger.length > 0 && (
            <section className="card">
              <h2 className="card-title">What your mistakes cost</h2>
              <ul className="space-y-2">
                {ledger.slice(0, 5).map((row) => (
                  <li key={row.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-loss/40 bg-loss/10 px-2 py-0.5 text-xs font-medium text-ink">{row.label}</span>
                      <span className="text-xs text-muted">{row.count} trade{row.count === 1 ? "" : "s"}</span>
                    </span>
                    <span className={`shrink-0 font-semibold tabular-nums ${row.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                      {fmtSignedMoney(row.pnl, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

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

      {/* Every P&L breakdown, one tabbed card */}
      <DashboardBreakdowns
        currency={currency}
        period={periodData}
        daily={daily}
        killzone={byKillzone}
        setup={byStrategy}
        symbol={bySymbol}
        weekday={byWeekday}
        concept={byConcept}
      />

      {/* Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card lg:col-span-2">
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
