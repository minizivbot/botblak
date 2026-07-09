import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { closedTrades, type StatsTrade } from "@/lib/stats";
import { fmtSignedMoney } from "@/lib/format";
import { etToday } from "@/lib/trading-day";
import { CrewSetup, CrewActions } from "@/components/CrewClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Crew" };

type MemberStats = {
  userId: string;
  username: string;
  isOwner: boolean;
  weekPnl: number;
  weekTrades: number;
  weekWins: number;
  greenToday: boolean | null; // null = no trades today
  streak: number; // consecutive green days ending at the last traded day
};

function greenStreak(dayPnls: [string, number][]): number {
  let run = 0;
  for (let i = dayPnls.length - 1; i >= 0; i--) {
    if (dayPnls[i][1] > 0) run++;
    else break;
  }
  return run;
}

export default async function CrewPage() {
  const viewer = await getViewer();
  if (viewer.isDemo || !viewer.userId) redirect("/login");

  const membership = await prisma.crewMember.findUnique({
    where: { userId: viewer.userId },
    include: { crew: { include: { members: { include: { user: { select: { id: true, username: true } } }, orderBy: { joinedAt: "asc" } } } } },
  });

  if (!membership) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Crew 👥</h1>
          <p className="mt-1 text-sm text-muted">
            Your private trading circle: see who&apos;s green today, compare the week, and keep each other honest.
            Invite-only — no strangers, no public leaderboard.
          </p>
        </div>
        <CrewSetup />
      </div>
    );
  }

  const crew = membership.crew;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const today = etToday();

  const stats: MemberStats[] = await Promise.all(
    crew.members.map(async (m) => {
      const trades = (await prisma.trade.findMany({
        where: { userId: m.userId, exitDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      })) as StatsTrade[];
      const closed = closedTrades(trades);

      const week = closed.filter((t) => t.closedAt >= weekAgo);
      const weekPnl = week.reduce((s, t) => s + t.pnl, 0);
      const weekWins = week.filter((t) => t.pnl > 0).length;

      const dayMap = new Map<string, number>();
      for (const t of closed) {
        const key = t.closedAt.toISOString().slice(0, 10);
        dayMap.set(key, (dayMap.get(key) ?? 0) + t.pnl);
      }
      const days = [...dayMap.entries()].sort(([a], [b]) => a.localeCompare(b));
      const todayPnl = dayMap.get(today);

      return {
        userId: m.userId,
        username: m.user.username,
        isOwner: m.userId === crew.ownerId,
        weekPnl,
        weekTrades: week.length,
        weekWins,
        greenToday: todayPnl == null ? null : todayPnl > 0,
        streak: greenStreak(days),
      };
    }),
  );

  const ranked = [...stats].sort((a, b) => b.weekPnl - a.weekPnl);
  const kingId = ranked[0]?.weekTrades ? ranked[0].userId : null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{crew.name} 👥</h1>
          <p className="text-xs text-muted">{stats.length} member{stats.length === 1 ? "" : "s"} · this week&apos;s scoreboard</p>
        </div>
        <CrewActions code={crew.code} />
      </div>

      {stats.length === 1 && (
        <div className="card border-accent/30 text-sm text-ink-2">
          It&apos;s just you in here 🦗 — copy the invite code above and send it to your trading friends.
        </div>
      )}

      <div className="space-y-2">
        {ranked.map((m, i) => (
          <div
            key={m.userId}
            className={`card flex items-center gap-3 ${m.userId === kingId ? "border-amber-400/40 bg-gradient-to-r from-amber-400/10 to-transparent" : ""}`}
          >
            <span className="w-6 text-center text-sm font-bold text-muted">{m.userId === kingId ? "👑" : i + 1}</span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-profit-mark text-sm font-bold text-white">
              {m.username[0]?.toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate text-sm font-semibold text-ink">
                {m.username}
                {m.userId === viewer.userId && <span className="text-xs font-normal text-muted">you</span>}
                {m.isOwner && <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">captain</span>}
                {m.streak >= 2 && <span className="text-xs">🔥{m.streak}</span>}
              </p>
              <p className="text-xs text-muted">
                {m.weekTrades > 0 ? `${m.weekTrades} trades · ${m.weekWins} wins this week` : "no trades this week"}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold tabular-nums ${m.weekPnl > 0 ? "text-profit" : m.weekPnl < 0 ? "text-loss" : "text-muted"}`}>
                {m.weekTrades > 0 ? fmtSignedMoney(m.weekPnl) : "—"}
              </p>
              <p className="text-[11px]">
                {m.greenToday == null ? (
                  <span className="text-muted">quiet today</span>
                ) : m.greenToday ? (
                  <span className="text-profit">● green today</span>
                ) : (
                  <span className="text-loss">● red today</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted">
        Crew members see each other&apos;s aggregate weekly stats only — never individual trades, notes or account
        details.
      </p>
    </div>
  );
}
