import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { computeStats, closedTrades, type StatsTrade } from "@/lib/stats";
import { edgeFindings, whatIfScenarios } from "@/lib/edge";
import { fmtMoney, fmtSignedMoney, fmtPct, fmtNum } from "@/lib/format";
import { PrintReportButton } from "@/components/PrintReportButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edge Report" };

export default async function ReportsPage() {
  const viewer = await getViewer();
  if (viewer.isDemo) redirect("/login");

  if (!viewer.isPro) {
    return (
      <div className="mx-auto max-w-lg space-y-4 pt-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-3xl">🔒</div>
        <h1 className="text-xl font-bold">The Edge Report is a Pro feature</h1>
        <p className="text-sm text-ink-2">
          It finds where your money actually comes from — and where it leaks. Every finding has a dollar amount
          attached, and the what-if simulator replays your whole history under discipline rules: &quot;what if I
          stopped after 2 losses a day?&quot; — answered with your real trades.
        </p>
        <Link href="/pricing" className="btn-primary inline-block">
          See Pro plans
        </Link>
      </div>
    );
  }

  const [settings, tradesRaw] = await Promise.all([
    prisma.settings.findUnique({ where: { userId: viewer.userId! } }),
    prisma.trade.findMany({ where: { userId: viewer.userId! }, orderBy: { entryDate: "asc" } }),
  ]);
  const trades = tradesRaw as StatsTrade[];
  const currency = settings?.currency ?? "USD";
  const stats = computeStats(trades, settings?.startingBalance ?? 0);
  const findings = edgeFindings(trades);
  const whatIfs = whatIfScenarios(trades);
  const closedCount = closedTrades(trades).length;

  const summary: { label: string; value: string }[] = [
    { label: "Net P&L", value: fmtSignedMoney(stats.totalPnl, currency) },
    { label: "Win rate", value: stats.winRate != null ? fmtPct(stats.winRate) : "—" },
    {
      label: "Profit factor",
      value:
        stats.profitFactor == null ? "—" : stats.profitFactor === Infinity ? "Perfect" : fmtNum(stats.profitFactor),
    },
    { label: "Expectancy / trade", value: stats.expectancy != null ? fmtSignedMoney(stats.expectancy, currency) : "—" },
    { label: "Max drawdown", value: fmtMoney(stats.maxDrawdown, currency) },
  ];

  return (
    <div className="space-y-5">
      {/* Print styles: hide app chrome so "Save as PDF" gives a clean report. */}
      <style>{`@media print {
        aside, header, .no-print { display: none !important; }
        main { padding: 0 !important; }
        body { background: #fff !important; }
      }`}</style>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            Edge Report
            <span className="ml-2 rounded-full bg-amber-400/15 px-2 py-0.5 align-middle text-[11px] font-bold text-amber-400">
              PRO
            </span>
          </h1>
          <p className="text-xs text-muted">
            {viewer.username} · {new Date().toISOString().slice(0, 10)} · {closedCount} closed trades analyzed
          </p>
        </div>
        <PrintReportButton />
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {summary.map((s) => (
          <div key={s.label} className="card break-inside-avoid">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="text-lg font-bold">{s.value}</p>
          </div>
        ))}
      </section>

      {closedCount < 6 ? (
        <div className="card space-y-2 py-10 text-center">
          <p className="text-3xl">🔬</p>
          <p className="text-sm font-medium text-ink">Not enough closed trades to find your edge yet.</p>
          <p className="text-xs text-muted">
            The Edge Finder needs at least ~6 closed trades to separate signal from luck. Keep journaling — it
            unlocks automatically.
          </p>
        </div>
      ) : (
        <>
          {/* ---- Edge Finder ---- */}
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">Edge Finder</h2>
              <p className="text-xs text-muted">
                Where your money actually comes from — and where it leaks. Amounts are from your real trades, not
                theory.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {findings.map((f) => (
                <div
                  key={f.title}
                  className={`card break-inside-avoid space-y-1.5 border-l-4 ${
                    f.tone === "good" ? "border-l-profit/70" : "border-l-loss/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">
                      <span className="mr-1.5">{f.emoji}</span>
                      {f.title}
                    </p>
                    {f.impact != null && (
                      <p
                        className={`shrink-0 text-sm font-bold tabular-nums ${
                          f.tone === "good" ? "text-profit" : "text-loss"
                        }`}
                      >
                        {f.tone === "good" ? "+" : "-"}
                        {fmtMoney(f.impact, currency)}
                      </p>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-ink-2">{f.detail}</p>
                </div>
              ))}
              {findings.length === 0 && (
                <p className="text-sm text-muted">
                  No strong patterns yet — your results are consistent across killzones, days and symbols.
                </p>
              )}
            </div>
          </section>

          {/* ---- What-if simulator ---- */}
          {whatIfs.length > 0 && (
            <section className="space-y-3">
              <div>
                <h2 className="text-base font-semibold">What-If Simulator</h2>
                <p className="text-xs text-muted">
                  Your entire history, replayed under one discipline rule. Actual net P&L:{" "}
                  <span className={stats.totalPnl >= 0 ? "text-profit" : "text-loss"}>
                    {fmtSignedMoney(stats.totalPnl, currency)}
                  </span>
                </p>
              </div>
              <div className="card overflow-x-auto p-0">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-edge text-left text-xs text-muted">
                      <th className="px-4 py-2.5 font-medium">Rule</th>
                      <th className="px-4 py-2.5 text-right font-medium">Trades kept</th>
                      <th className="px-4 py-2.5 text-right font-medium">P&L under rule</th>
                      <th className="px-4 py-2.5 text-right font-medium">vs. reality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {whatIfs.map((w) => (
                      <tr key={w.label} className="border-b border-edge/50 last:border-0">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-ink">{w.label}</p>
                          <p className="text-xs text-muted">{w.description}</p>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted">
                          {w.tradesKept}/{w.tradesTotal}
                        </td>
                        <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${w.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                          {fmtSignedMoney(w.pnl, currency)}
                        </td>
                        <td className={`px-4 py-2.5 text-right font-bold tabular-nums ${w.delta >= 0 ? "text-profit" : "text-loss"}`}>
                          {w.delta >= 0 ? "▲ " : "▼ "}
                          {fmtSignedMoney(w.delta, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-muted">
                Hindsight is easier than discipline — treat these as the price tag of breaking your rules, not a
                promise of future returns.
              </p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
