import type { AchievementState } from "@/lib/achievements";

/**
 * Badge shelf on the dashboard: unlocked badges glow, locked ones show live
 * progress toward their target. Pure render — computed server-side.
 */
export function AchievementsRow({ list }: { list: AchievementState[] }) {
  const unlocked = list.filter((a) => a.unlocked);
  // Locked badges closest to unlocking first — that's the carrot.
  const locked = list
    .filter((a) => !a.unlocked)
    .sort((a, b) => b.current / b.target - a.current / a.target);

  return (
    <section className="card">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="card-title mb-0 flex items-center gap-2">
          <span>🏅</span> Achievements
        </h2>
        <p className="text-xs text-muted">
          {unlocked.length}/{list.length} unlocked
        </p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[...unlocked, ...locked].map((a) => {
          const pct = Math.min(100, Math.round((a.current / a.target) * 100));
          return (
            <div
              key={a.id}
              title={`${a.name} — ${a.desc}${a.unlocked ? "" : ` (${a.current}/${a.target})`}`}
              className={`w-24 shrink-0 rounded-xl border px-2 py-2.5 text-center ${
                a.unlocked
                  ? "border-amber-400/40 bg-gradient-to-b from-amber-400/15 to-transparent"
                  : "border-edge bg-raised/30 opacity-80"
              }`}
            >
              <p className={`text-2xl ${a.unlocked ? "" : "grayscale"}`}>{a.emoji}</p>
              <p className={`mt-1 truncate text-[11px] font-semibold ${a.unlocked ? "text-amber-300" : "text-ink-2"}`}>
                {a.name}
              </p>
              {a.unlocked ? (
                <p className="text-[10px] font-bold text-amber-400/80">UNLOCKED</p>
              ) : (
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-raised">
                  <div className="h-full rounded-full bg-accent/70" style={{ width: `${pct}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
