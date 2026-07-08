import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { etToday, etMidnightUtc } from "@/lib/trading-day";
import { tradePnl } from "@/lib/pnl";
import { fmtSignedMoney, fmtMoney } from "@/lib/format";
import { KillzonePanel } from "@/components/KillzonePanel";
import { DayPlanCard } from "@/components/DayPlanCard";
import { SizeCalculator } from "@/components/SizeCalculator";

export const dynamic = "force-dynamic";
export const metadata = { title: "Today" };

export default async function TodayPage() {
  const viewer = await getViewer();
  if (viewer.isDemo) redirect("/login");

  if (!viewer.isPro) {
    return (
      <div className="mx-auto max-w-lg space-y-4 pt-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-3xl">🔒</div>
        <h1 className="text-xl font-bold">Today is a Pro feature</h1>
        <p className="text-sm text-ink-2">
          Your trading-day command center: a live killzone clock (which window is open, how long is left), a
          pre-market plan with bias and a hard trade cap, your live P&L against the daily loss limit, and a futures
          position-size calculator. Open it every morning — it replaces the sticky note on your monitor.
        </p>
        <Link href="/pricing" className="btn-primary inline-block">
          See Pro plans
        </Link>
      </div>
    );
  }

  const dayStart = etMidnightUtc();
  const [plan, settings, todayTrades] = await Promise.all([
    prisma.dayPlan.findUnique({ where: { userId_date: { userId: viewer.userId!, date: etToday() } } }),
    prisma.settings.findUnique({ where: { userId: viewer.userId! } }),
    prisma.trade.findMany({
      where: { userId: viewer.userId!, exitDate: { gte: dayStart } },
      select: { direction: true, entryPrice: true, exitPrice: true, size: true, fees: true },
    }),
  ]);

  const currency = settings?.currency ?? "USD";
  const pnlToday = todayTrades.reduce((s, t) => s + (tradePnl(t) ?? 0), 0);
  const tradesToday = todayTrades.length;
  const maxDailyLoss = settings?.maxDailyLoss ?? null;
  const lossUsed = maxDailyLoss && pnlToday < 0 ? Math.min(1, -pnlToday / maxDailyLoss) : 0;
  const maxTrades = plan?.maxTrades ?? null;
  const tradesUsed = maxTrades ? Math.min(1, tradesToday / maxTrades) : 0;

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">
          Today
          <span className="ml-2 rounded-full bg-amber-400/15 px-2 py-0.5 align-middle text-[11px] font-bold text-amber-400">
            PRO
          </span>
        </h1>
        <p className="text-xs text-muted">{dateLabel} · New York trading day</p>
      </div>

      {/* Live day status */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card">
          <p className="text-xs text-muted">P&L today</p>
          <p className={`text-xl font-bold ${pnlToday > 0 ? "text-profit" : pnlToday < 0 ? "text-loss" : ""}`}>
            {fmtSignedMoney(pnlToday, currency)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-muted">Closed trades</p>
          <p className="text-xl font-bold">
            {tradesToday}
            {maxTrades != null && <span className="text-sm font-semibold text-muted"> / {maxTrades}</span>}
          </p>
          {maxTrades != null && (
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-raised">
              <div
                className={`h-full rounded-full ${tradesUsed >= 1 ? "bg-loss" : tradesUsed >= 0.67 ? "bg-amber-400" : "bg-accent"}`}
                style={{ width: `${tradesUsed * 100}%` }}
              />
            </div>
          )}
        </div>
        <div className="card col-span-2">
          <div className="flex items-baseline justify-between">
            <p className="text-xs text-muted">Daily loss limit</p>
            {maxDailyLoss != null ? (
              <p className="text-xs text-muted tabular-nums">
                {pnlToday < 0 ? fmtMoney(-pnlToday, currency) : fmtMoney(0, currency)} of {fmtMoney(maxDailyLoss, currency)}
              </p>
            ) : (
              <Link href="/settings" className="text-xs text-accent hover:underline">
                Set one in Settings →
              </Link>
            )}
          </div>
          {maxDailyLoss != null ? (
            <>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-raised">
                <div
                  className={`h-full rounded-full transition-all ${lossUsed >= 1 ? "bg-loss" : lossUsed >= 0.7 ? "bg-amber-400" : "bg-profit"}`}
                  style={{ width: `${Math.max(lossUsed * 100, lossUsed > 0 ? 4 : 0)}%` }}
                />
              </div>
              <p className={`mt-1.5 text-xs ${lossUsed >= 1 ? "font-bold text-loss" : "text-muted"}`}>
                {lossUsed >= 1
                  ? "STOP. Limit hit — the best trade left today is no trade."
                  : lossUsed >= 0.7
                    ? "Careful — one bad trade from the limit."
                    : "Green zone."}
              </p>
            </>
          ) : (
            <p className="mt-2 text-xs text-muted">
              A hard daily stop is the single cheapest edge in trading — set it once and this bar goes live.
            </p>
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <DayPlanCard
          initial={plan ? { bias: plan.bias, focus: plan.focus, maxTrades: plan.maxTrades, note: plan.note } : null}
        />
        <div className="space-y-4">
          <KillzonePanel />
          <SizeCalculator />
        </div>
      </div>
    </div>
  );
}
