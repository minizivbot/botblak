import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { computeAchievements } from "@/lib/achievements";
import { DemoBanner } from "@/components/DemoBanner";

export const dynamic = "force-dynamic";
export const metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  const viewer = await getViewer();
  if (!viewer.userId) redirect("/login");

  const [trades, accounts, settings] = await Promise.all([
    prisma.trade.findMany({ where: { userId: viewer.userId } }),
    prisma.account.findMany({ where: { userId: viewer.userId }, select: { propFunded: true } }),
    prisma.settings.findUnique({ where: { userId: viewer.userId } }),
  ]);
  const list = computeAchievements({
    trades,
    anyFunded: accounts.some((a) => a.propFunded),
    hasLossLimit: settings?.maxDailyLoss != null,
  });

  const unlocked = list.filter((a) => a.unlocked);
  const locked = list.filter((a) => !a.unlocked).sort((a, b) => b.current / b.target - a.current / a.target);
  const pct = Math.round((unlocked.length / list.length) * 100);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {viewer.isDemo && <DemoBanner />}

      <div>
        <h1 className="text-xl font-semibold">Achievements 🏅</h1>
        <p className="mt-1 text-sm text-muted">
          Earned from your real trades — no participation trophies. New badges send a push the moment they unlock.
        </p>
      </div>

      <div className="card">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold">
            {unlocked.length} of {list.length} unlocked
          </p>
          <p className="text-xs text-muted">{pct}%</p>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-raised">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {unlocked.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold tracking-wide text-muted uppercase">Unlocked</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {unlocked.map((a) => (
              <div
                key={a.id}
                className="card flex items-center gap-3 border-amber-400/40 bg-gradient-to-br from-amber-400/10 to-transparent"
              >
                <span className="text-4xl drop-shadow-[0_0_12px_rgba(245,190,66,0.35)]">{a.emoji}</span>
                <div className="min-w-0">
                  <p className="font-bold text-amber-300">{a.name}</p>
                  <p className="text-xs text-ink-2">{a.desc}</p>
                </div>
                <span className="ml-auto shrink-0 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  ✓
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {locked.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold tracking-wide text-muted uppercase">In progress</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {locked.map((a) => {
              const progress = Math.min(100, Math.round((a.current / a.target) * 100));
              return (
                <div key={a.id} className="card flex items-center gap-3">
                  <span className="text-4xl grayscale">{a.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink-2">{a.name}</p>
                    <p className="text-xs text-muted">{a.desc}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised">
                        <div className="h-full rounded-full bg-accent/70" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="shrink-0 text-[10px] text-muted tabular-nums">
                        {a.current}/{a.target}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
