import { fmtSignedMoney, fmtMoney } from "@/lib/format";

type Props = {
  todayPnl: number;
  todayCount: number;
  maxDailyLoss: number | null;
  currency: string;
};

/**
 * Today's session strip + the risk guard. When a daily loss limit is set in
 * Settings and today's realized losses cross it (or get close), this turns
 * into an impossible-to-miss banner.
 */
export function RiskGuard({ todayPnl, todayCount, maxDailyLoss, currency }: Props) {
  const limitHit = maxDailyLoss != null && todayPnl <= -maxDailyLoss;
  const nearLimit = !limitHit && maxDailyLoss != null && todayPnl <= -0.8 * maxDailyLoss;

  if (limitHit) {
    return (
      <div className="card !border-loss/60 bg-loss/10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl">🛑</span>
          <div>
            <p className="text-base font-bold text-loss">Daily loss limit hit — stop trading.</p>
            <p className="text-sm text-ink-2">
              Today: <span className="font-semibold text-loss">{fmtSignedMoney(todayPnl, currency)}</span> across{" "}
              {todayCount} trade{todayCount === 1 ? "" : "s"} · limit {fmtMoney(maxDailyLoss!, currency)}. The best
              trade you can make right now is closing the platform. Tomorrow the market is still here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (nearLimit) {
    return (
      <div className="card !border-yellow-600/50 bg-yellow-500/10">
        <p className="text-sm font-semibold text-yellow-500">
          ⚠️ Careful — today is {fmtSignedMoney(todayPnl, currency)}, at{" "}
          {Math.round((Math.abs(todayPnl) / maxDailyLoss!) * 100)}% of your {fmtMoney(maxDailyLoss!, currency)} daily
          loss limit. Size down or step away.
        </p>
      </div>
    );
  }

  if (todayCount === 0) return null;
  return (
    <p className="text-sm text-muted">
      Today:{" "}
      <span className={`font-semibold ${todayPnl >= 0 ? "text-profit" : "text-loss"}`}>
        {fmtSignedMoney(todayPnl, currency)}
      </span>{" "}
      · {todayCount} closed trade{todayCount === 1 ? "" : "s"}
      {maxDailyLoss != null && <> · risk guard armed at {fmtMoney(maxDailyLoss, currency)}</>}
    </p>
  );
}
