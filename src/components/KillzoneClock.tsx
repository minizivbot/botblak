"use client";

import { useEffect, useState } from "react";

/** Killzone windows in ET, minutes from midnight. */
const WINDOWS: { name: string; start: number; end: number }[] = [
  { name: "London KZ", start: 2 * 60, end: 5 * 60 },
  { name: "NY AM KZ", start: 7 * 60, end: 10 * 60 },
  { name: "London Close KZ", start: 10 * 60, end: 12 * 60 },
  { name: "NY PM KZ", start: 13.5 * 60, end: 16 * 60 },
  { name: "Asia KZ", start: 20 * 60, end: 24 * 60 },
];

function etNow(): { minutes: number; clock: string } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return { minutes: h * 60 + m, clock: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` };
}

function fmtIn(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Live session clock: which killzone is open right now (NY time) and how long
 * until it closes — or which one opens next. Ticks every 30 seconds.
 */
export function KillzoneClock() {
  const [state, setState] = useState<{ label: string; active: boolean; clock: string } | null>(null);

  useEffect(() => {
    const update = () => {
      const { minutes, clock } = etNow();
      const current = WINDOWS.find((w) => minutes >= w.start && minutes < w.end);
      if (current) {
        setState({ label: `${current.name} · closes in ${fmtIn(current.end - minutes)}`, active: true, clock });
        return;
      }
      const upcoming =
        WINDOWS.filter((w) => w.start > minutes).sort((a, b) => a.start - b.start)[0] ?? WINDOWS[0];
      const wait = upcoming.start > minutes ? upcoming.start - minutes : 24 * 60 - minutes + upcoming.start;
      setState({ label: `${upcoming.name} · opens in ${fmtIn(wait)}`, active: false, clock });
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  if (!state) return null;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        state.active
          ? "border-profit/50 bg-profit/10 text-profit"
          : "border-edge bg-surface text-muted"
      }`}
      title={`New York time: ${state.clock}`}
    >
      <span className={`h-2 w-2 rounded-full ${state.active ? "animate-pulse bg-profit" : "bg-muted"}`} />
      {state.label}
      <span className="font-normal opacity-70">NY {state.clock}</span>
    </span>
  );
}
