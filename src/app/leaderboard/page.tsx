import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { getSiteConfig } from "@/lib/siteconfig";
import { computeStats, type StatsTrade } from "@/lib/stats";
import { fmtSignedMoney, fmtPct } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leaderboard" };

type Row = {
  username: string;
  isYou: boolean;
  pnl: number;
  winRate: number | null;
  trades: number;
  funded: boolean;
  verified: boolean;
  currency: string;
};

export default async function LeaderboardPage() {
  const { username } = await getViewer();

  if (!(await getSiteConfig()).leaderboardEnabled) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="card text-center">
          <p className="text-4xl">🏆</p>
          <h1 className="mt-2 text-lg font-semibold">Leaderboard is off</h1>
          <p className="mt-1 text-sm text-muted">The leaderboard is currently disabled by the site admin.</p>
          <Link href="/" className="btn-ghost mt-4 inline-block">← Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const users = await prisma.user.findMany({
    select: {
      username: true,
      settings: { select: { currency: true, showOnLeaderboard: true } },
      accounts: { select: { propFunded: true } },
      trades: {
        select: { id: true, symbol: true, direction: true, entryPrice: true, exitPrice: true, size: true, fees: true, entryDate: true, exitDate: true, strategy: true, source: true },
      },
    },
  });

  const rows: Row[] = users
    .filter((u) => u.settings?.showOnLeaderboard !== false)
    .map((u) => {
      const stats = computeStats(u.trades as StatsTrade[], 0);
      // "Verified" = at least some trades pulled straight from a broker, not
      // typed in by hand. Self-reported numbers can't earn the badge.
      const verified = u.trades.some((t) => t.source === "alpaca" || t.source === "tradovate");
      return {
        username: u.username,
        isYou: u.username === username,
        pnl: stats.totalPnl,
        winRate: stats.winRate,
        trades: stats.closedCount,
        funded: u.accounts.some((a) => a.propFunded),
        verified,
        currency: u.settings?.currency ?? "USD",
      };
    })
    .filter((r) => r.trades > 0)
    .sort((a, b) => b.pnl - a.pnl);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Leaderboard</h1>
        <p className="mt-1 text-sm text-muted">
          Every trader on TradeZone, ranked by net P&L. A <span className="text-accent">✓ Verified</span> badge means
          the trades were pulled straight from a broker — everything else is self-reported, so take unverified numbers
          with a grain of salt. You can hide yourself from the board in Settings.
        </p>
      </div>

      {/* Podium — top 3 */}
      {rows.length >= 1 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {rows.slice(0, 3).map((r, i) => (
            <Link
              href={`/u/${encodeURIComponent(r.username)}`}
              key={r.username}
              className={`card flex flex-col items-center text-center transition-transform hover:-translate-y-0.5 ${
                i === 0 ? "!border-yellow-500/40 bg-yellow-500/5" : ""
              } ${r.isYou ? "ring-1 ring-accent/50" : ""}`}
            >
              <div className="text-3xl">{medals[i]}</div>
              <p className="mt-1 truncate text-sm font-semibold">
                {r.username}
                {r.isYou && <span className="ml-1 text-xs text-accent">you</span>}
              </p>
              <div className="mt-1 flex gap-1">
                {r.verified ? (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">✓ Verified</span>
                ) : (
                  <span className="rounded-full bg-raised px-2 py-0.5 text-[10px] font-medium text-muted">self-reported</span>
                )}
                {r.funded && (
                  <span className="rounded-full bg-profit/15 px-2 py-0.5 text-[10px] font-bold text-profit">FUNDED ✓</span>
                )}
              </div>
              <p className={`mt-2 text-xl font-bold ${r.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                {fmtSignedMoney(r.pnl, r.currency)}
              </p>
              <p className="text-xs text-muted">
                {r.winRate != null ? `${fmtPct(r.winRate)} win` : "—"} · {r.trades} trades
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* The rest */}
      {rows.length > 3 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[440px] text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">#</th>
                <th className="px-4 py-2.5 font-medium">Trader</th>
                <th className="px-4 py-2.5 text-right font-medium">Net P&L</th>
                <th className="px-4 py-2.5 text-right font-medium">Win rate</th>
                <th className="px-4 py-2.5 text-right font-medium">Trades</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(3).map((r, i) => (
                <tr key={r.username} className={`border-b border-edge/50 last:border-0 ${r.isYou ? "bg-accent/5" : ""}`}>
                  <td className="px-4 py-2.5 text-muted">{i + 4}</td>
                  <td className="px-4 py-2.5 font-medium">
                    <Link href={`/u/${encodeURIComponent(r.username)}`} className="hover:text-accent hover:underline">
                      {r.username}
                    </Link>
                    {r.isYou && <span className="ml-1 text-xs text-accent">you</span>}
                    {r.verified && <span className="ml-2 rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">✓</span>}
                    {r.funded && <span className="ml-1.5 rounded-full bg-profit/15 px-1.5 py-0.5 text-[10px] font-bold text-profit">FUNDED</span>}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${r.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                    {fmtSignedMoney(r.pnl, r.currency)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-ink-2">{r.winRate != null ? fmtPct(r.winRate) : "—"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted">{r.trades}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length === 0 && <p className="card text-sm text-muted">No traders with closed trades yet — be the first!</p>}
    </div>
  );
}
