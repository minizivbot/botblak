"use client";

import { useEffect, useState } from "react";

/** ICT killzone windows in ET minutes from midnight. */
const WINDOWS: { label: string; start: number; end: number }[] = [
  { label: "London KZ", start: 2 * 60, end: 5 * 60 },
  { label: "NY AM KZ", start: 7 * 60, end: 10 * 60 },
  { label: "London Close KZ", start: 10 * 60, end: 12 * 60 },
  { label: "NY PM KZ", start: 13.5 * 60, end: 16 * 60 },
  { label: "Asia KZ", start: 20 * 60, end: 24 * 60 },
];

function etNow(): { minutes: number; clock: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return { minutes: h * 60 + m, clock: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` };
}

const fmtMins = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtClock = (mins: number) =>
  `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(Math.round(mins % 60)).padStart(2, "0")}`;

/** Full killzone board for the Today page: live window, countdown, all sessions. */
export function KillzonePanel() {
  const [now, setNow] = useState<{ minutes: number; clock: string } | null>(null);

  useEffect(() => {
    setNow(etNow());
    const id = setInterval(() => setNow(etNow()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!now) return <div className="card h-48 animate-pulse" aria-hidden />;

  const active = WINDOWS.find((w) => now.minutes >= w.start && now.minutes < w.end) ?? null;
  const upcoming = WINDOWS.filter((w) => w.start > now.minutes).sort((a, b) => a.start - b.start)[0] ?? WINDOWS[0];
  const wait = upcoming.start > now.minutes ? upcoming.start - now.minutes : 24 * 60 - now.minutes + upcoming.start;

  return (
    <div className="card space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Killzones</h2>
        <p className="text-xs text-muted">
          NY <span className="font-semibold text-ink tabular-nums">{now.clock}</span>
        </p>
      </div>

      {active ? (
        <div className="rounded-xl border border-profit/40 bg-profit/10 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-profit uppercase">
            <span className="h-2 w-2 animate-pulse rounded-full bg-profit" /> Live now
          </p>
          <p className="mt-0.5 text-lg font-bold text-ink">{active.label}</p>
          <p className="text-xs text-muted">closes in {fmtMins(active.end - now.minutes)}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-edge bg-raised/40 px-3 py-2.5">
          <p className="text-[11px] font-bold tracking-wide text-muted uppercase">Off-hours</p>
          <p className="mt-0.5 text-sm text-ink-2">
            Next: <span className="font-semibold text-ink">{upcoming.label}</span> in{" "}
            <span className="font-semibold text-accent">{fmtMins(wait)}</span>
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        {WINDOWS.map((w) => {
          const isActive = active?.label === w.label;
          const pct = isActive ? Math.min(100, ((now.minutes - w.start) / (w.end - w.start)) * 100) : 0;
          return (
            <div key={w.label} className="flex items-center gap-2 text-xs">
              <span className={`w-30 shrink-0 ${isActive ? "font-semibold text-ink" : "text-muted"}`}>{w.label}</span>
              <span className="w-21 shrink-0 text-muted tabular-nums">
                {fmtClock(w.start)}–{fmtClock(w.end)}
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised">
                {isActive && <span className="block h-full rounded-full bg-profit" style={{ width: `${pct}%` }} />}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
