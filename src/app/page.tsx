import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { ensureDefaultAccount } from "@/lib/accounts";
import { DemoBanner } from "@/components/DemoBanner";
import { CountUp } from "@/components/CountUp";
import { KillzoneClock } from "@/components/KillzoneClock";
import { RiskGuard } from "@/components/RiskGuard";
import { DayPlanCard } from "@/components/DayPlanCard";
import { ShareButton } from "@/components/ShareButton";
import { closedTrades, type StatsTrade } from "@/lib/stats";
import { dailyGrades } from "@/lib/discipline";
import { etToday, etDateOf } from "@/lib/trading-day";
import { fmtSignedMoney, fmtNum } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Today — TradeZone" };

function gradeClass(grade: string): string {
  if (grade === "A" || grade === "B") return "border-profit/50 bg-profit/10 text-profit";
  if (grade === "C") return "border-accent/50 bg-accent/10 text-accent";
  return "border-loss/50 bg-loss/10 text-loss";
}

/** The trading-day cockpit: plan, session state, rules — before the numbers. */
export default async function TodayPage() {
  const { userId, isDemo, username } = await getViewer();
  if (!userId) redirect("/login");
  if (!isDemo) await ensureDefaultAccount(userId);

  // Brand-new signed-in user with no trades yet → onboarding.
  if (!isDemo) {
    const anyTrades = await prisma.trade.count({ where: { userId } });
    if (anyTrades === 0) {
      const { Onboarding } = await import("@/components/Onboarding");
      return <Onboarding username={username} />;
    }
  }

  const today = etToday();
  const [tradesRaw, settings, plan, news] = await Promise.all([
    prisma.trade.findMany({ where: { userId }, orderBy: { entryDate: "asc" } }),
    prisma.settings.findUnique({ where: { userId } }),
    prisma.dayPlan.findUnique({ where: { userId_date: { userId, date: today } } }),
    prisma.newsEvent.findMany({ where: { date: today }, orderBy: { time: "asc" } }),
  ]);
  const currency = settings?.currency ?? "USD";

  const closed = closedTrades(tradesRaw as StatsTrade[]);
  const todayTrades = closed.filter((t) => etDateOf(t.closedAt) === today);
  const todayPnl = todayTrades.reduce((s, t) => s + t.pnl, 0);
  const todayWins = todayTrades.filter((t) => t.pnl > 0).length;
  const todayRR = (() => {
    const vals = todayTrades.map((t) => (t as { rr?: number | null }).rr).filter((v): v is number => v != null);
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
  })();
  const open = tradesRaw.filter((t) => t.exitPrice == null);

  const grades = dailyGrades(tradesRaw as StatsTrade[], settings?.maxDailyLoss ?? null);
  const todayGrade = grades.find((g) => g.date === today) ?? null;
  const recent = grades.filter((g) => g.date !== today).slice(0, 6);

  const overLimit = plan?.maxTrades != null && todayTrades.length > plan.maxTrades;
  const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false });
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });

  return (
    <div className="space-y-4">
      {isDemo && <DemoBanner />}

      {/* Header: the day, not the account */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{dateLabel} · New York</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {username ? `Ready, ${username}.` : "Ready."}
          </h1>
        </div>
        <KillzoneClock />
      </div>

      <RiskGuard
        todayPnl={todayPnl}
        todayCount={todayTrades.length}
        maxDailyLoss={settings?.maxDailyLoss ?? null}
        currency={currency}
      />

      {/* Plan first — the coach's opening question */}
      <DayPlanCard
        initial={plan ? { bias: plan.bias, focus: plan.focus, maxTrades: plan.maxTrades, note: plan.note } : null}
        readOnly={isDemo}
      />

      {/* The session so far */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="card-title mb-0">Session</h2>
            {todayTrades.length > 0 && !isDemo && (
              <ShareButton href={`/api/share/day/${today}`} filename={`tradezone-${today}.png`} label="Share day" className="btn-ghost !px-3 !py-1.5 text-xs" />
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-3">
            <div>
              <p className="text-xs text-muted">Today&apos;s P&L</p>
              <p className={`text-3xl font-bold tracking-tight ${todayPnl > 0 ? "text-profit" : todayPnl < 0 ? "text-loss" : "text-ink"}`}>
                {todayTrades.length ? <CountUp value={todayPnl} currency={currency} /> : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Trades</p>
              <p className={`text-xl font-semibold ${overLimit ? "text-loss" : "text-ink"}`}>
                {todayTrades.length}
                {plan?.maxTrades != null && <span className="text-sm text-muted"> / {plan.maxTrades}</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Winners</p>
              <p className="text-xl font-semibold text-ink">{todayTrades.length ? `${todayWins}/${todayTrades.length}` : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Avg R:R</p>
              <p className="text-xl font-semibold text-ink">{todayRR == null ? "—" : `${fmtNum(todayRR)}R`}</p>
            </div>
            {todayGrade && (
              <div>
                <p className="text-xs text-muted">Discipline</p>
                <span className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-bold ${gradeClass(todayGrade.grade)}`}>
                  {todayGrade.grade}
                </span>
              </div>
            )}
          </div>
          {overLimit && (
            <p className="mt-3 rounded-lg border border-loss/40 bg-loss/10 px-3 py-2 text-sm text-loss">
              You&apos;re past your own max of {plan!.maxTrades} trades — your plan says stop.
            </p>
          )}

          {todayTrades.length > 0 && (
            <ul className="mt-4 divide-y divide-edge/60">
              {[...todayTrades].reverse().map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span className={t.direction === "LONG" ? "badge-long" : "badge-short"}>
                      {t.direction === "LONG" ? "L" : "S"}
                    </span>
                    <span className="font-medium">{t.symbol}</span>
                    <span className="text-xs text-muted">{timeFmt.format(t.closedAt)}</span>
                  </span>
                  <span className={`font-semibold tabular-nums ${t.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                    {fmtSignedMoney(t.pnl, currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {open.length > 0 && (
            <p className="mt-3 text-xs text-accent">{open.length} open position{open.length === 1 ? "" : "s"}</p>
          )}

          <div className="mt-4 flex gap-2">
            <Link href="/trades" className="btn-primary text-sm">+ Log a trade</Link>
            <Link href="/review" className="btn-ghost text-sm">Full review →</Link>
          </div>
        </section>

        <div className="space-y-4">
          {/* Red-folder news */}
          <section className="card">
            <h2 className="card-title">📕 News today</h2>
            {news.length === 0 ? (
              <p className="text-sm text-muted">No high-impact events — clean tape.</p>
            ) : (
              <ul className="space-y-2">
                {news.map((n) => (
                  <li key={n.id} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 shrink-0 rounded bg-loss/15 px-1.5 py-0.5 text-[10px] font-bold text-loss">
                      {n.time || "All day"}
                    </span>
                    <span className="text-ink-2">
                      <span className="font-medium text-ink">{n.currency}</span> — {n.title}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-[11px] text-muted">Times in New York.</p>
          </section>

          {/* Recent sessions */}
          {recent.length > 0 && (
            <section className="card">
              <h2 className="card-title">Last sessions</h2>
              <ul className="space-y-1.5">
                {recent.map((g) => (
                  <li key={g.date} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-md border text-xs font-bold ${gradeClass(g.grade)}`}>
                        {g.grade}
                      </span>
                      <span className="text-xs text-muted">{g.date.slice(5)}</span>
                    </span>
                    <span className={`font-semibold tabular-nums ${g.pnl > 0 ? "text-profit" : g.pnl < 0 ? "text-loss" : "text-ink-2"}`}>
                      {fmtSignedMoney(g.pnl, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
