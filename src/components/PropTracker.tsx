import type { PropStatus } from "@/lib/prop";
import { fmtMoney, fmtSignedMoney, fmtPct } from "@/lib/format";

function Bar({ pct, tone }: { pct: number; tone: "good" | "warn" | "bad" }) {
  const color = tone === "bad" ? "bg-loss" : tone === "warn" ? "bg-yellow-500" : "bg-profit";
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-raised">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

/**
 * Prop-firm dashboard card: profit-target progress and trailing-drawdown
 * cushion — the two numbers that decide whether a funded account survives.
 */
export function PropTracker({ status, accountName, currency }: { status: PropStatus; accountName: string; currency: string }) {
  if (!status.enabled) return null;

  const cushionPct =
    status.maxDrawdown && status.cushion != null ? (status.cushion / status.maxDrawdown) * 100 : null;
  const cushionTone = cushionPct == null ? "good" : cushionPct <= 20 ? "bad" : cushionPct <= 50 ? "warn" : "good";
  const consistencyBad = status.bestDayShare != null && status.bestDayShare > 0.4;

  return (
    <section className="card !border-accent/30">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="card-title mb-0 flex items-center gap-2">
          <span>🏦</span> Prop account · {accountName}
        </h2>
        <span className="text-sm text-muted">
          Balance <span className="font-semibold text-ink">{fmtMoney(status.currentBalance, currency)}</span>
        </span>
      </div>

      {status.breached && (
        <p className="mb-3 rounded-lg border border-loss/50 bg-loss/10 px-3 py-2 text-sm font-semibold text-loss">
          ⛔ Your equity crossed the drawdown line at some point — on a real funded account that&apos;s a blown account.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Profit target */}
        {status.target != null && (
          <div>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="text-muted">Profit target</span>
              <span className={`font-semibold ${status.targetReached ? "text-profit" : "text-ink"}`}>
                {fmtSignedMoney(status.netProfit, currency)} / {fmtMoney(status.target, currency)}
              </span>
            </div>
            <Bar
              pct={(status.targetProgress ?? 0) * 100}
              tone={status.targetReached ? "good" : status.netProfit < 0 ? "bad" : "warn"}
            />
            <p className="mt-1 text-xs text-muted">
              {status.targetReached
                ? "🎉 Target reached — you're eligible for payout / next phase."
                : status.netProfit < 0
                  ? "Below start balance — climb back to green first."
                  : `${fmtPct(status.targetProgress ?? 0)} there · ${fmtMoney(status.target - status.netProfit, currency)} to go`}
            </p>
          </div>
        )}

        {/* Trailing drawdown cushion */}
        {status.maxDrawdown != null && status.cushion != null && (
          <div>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="text-muted">{status.drawdownType === "trailing" ? "Trailing" : "Static"} drawdown cushion</span>
              <span className={`font-semibold ${cushionTone === "bad" ? "text-loss" : cushionTone === "warn" ? "text-yellow-500" : "text-profit"}`}>
                {fmtMoney(status.cushion, currency)} left
              </span>
            </div>
            <Bar pct={cushionPct ?? 0} tone={cushionTone} />
            <p className="mt-1 text-xs text-muted">
              Stay above {fmtMoney(status.drawdownLine ?? 0, currency)}.
              {status.minCushion != null && status.minCushion < status.cushion && (
                <> Closest you came: {fmtMoney(status.minCushion, currency)}.</>
              )}
            </p>
          </div>
        )}
      </div>

      {consistencyBad && (
        <p className="mt-3 rounded-lg border border-yellow-600/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-500">
          ⚠️ Consistency: your best day is {fmtPct(status.bestDayShare ?? 0)} of total profit. Many firms cap a single
          day at 30–40% — spread your gains across more days.
        </p>
      )}
    </section>
  );
}
