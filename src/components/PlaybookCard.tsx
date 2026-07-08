"use client";

import { useEffect, useState } from "react";
import type { Playbook } from "@/lib/playbooks";

const DIFF_COLORS: Record<Playbook["difficulty"], string> = {
  Starter: "bg-profit/15 text-profit",
  Intermediate: "bg-accent/15 text-accent",
  Advanced: "bg-amber-400/15 text-amber-400",
};

/**
 * One expandable playbook: the lesson, plus a live checklist that persists in
 * localStorage so it can be run during the session and reset per trade.
 */
export function PlaybookCard({ pb }: { pb: Playbook }) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(() => pb.checklist.map(() => false));
  const storageKey = `pb-${pb.id}`;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(saved) && saved.length === pb.checklist.length) setChecked(saved);
    } catch {
      /* fresh start */
    }
  }, [storageKey, pb.checklist.length]);

  function toggle(i: number) {
    setChecked((prev) => {
      const next = prev.map((v, j) => (j === i ? !v : v));
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  function reset() {
    const next = pb.checklist.map(() => false);
    setChecked(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  const done = checked.filter(Boolean).length;
  const ready = done === pb.checklist.length;

  return (
    <div className="card space-y-0 p-0">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <span className="text-2xl">{pb.emoji}</span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink">{pb.name}</span>
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${DIFF_COLORS[pb.difficulty]}`}>
              {pb.difficulty}
            </span>
            <span className="text-[10px] text-muted">{pb.readMinutes} min</span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted">{pb.tagline}</span>
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="space-y-5 border-t border-edge px-4 py-4 sm:px-5">
          <p className="rounded-lg bg-raised/50 px-3 py-2 text-xs text-ink-2">
            <span className="font-semibold text-accent">⏰ When:</span> {pb.window}
          </p>

          <section className="space-y-2">
            <h3 className="text-xs font-bold tracking-wide text-muted uppercase">The idea</h3>
            {pb.idea.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-ink-2">
                {p}
              </p>
            ))}
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-wide text-muted uppercase">
                Entry checklist · {done}/{pb.checklist.length}
              </h3>
              <button onClick={reset} className="text-xs text-muted hover:text-ink-2">
                Reset
              </button>
            </div>
            <div className="space-y-1.5">
              {pb.checklist.map((item, i) => (
                <label
                  key={i}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition-colors ${
                    checked[i] ? "border-profit/40 bg-profit/5" : "border-edge bg-raised/30 hover:border-edge/80"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked[i]}
                    onChange={() => toggle(i)}
                    className="mt-0.5 h-4 w-4 accent-[#22c55e]"
                  />
                  <span className={`text-sm ${checked[i] ? "text-ink" : "text-ink-2"}`}>{item}</span>
                </label>
              ))}
            </div>
            <p
              className={`rounded-lg px-3 py-2 text-center text-xs font-semibold ${
                ready ? "bg-profit/15 text-profit" : "bg-raised/50 text-muted"
              }`}
            >
              {ready ? "✅ All conditions met — this is an A+ setup. Execute the plan." : "Every box, every time. Missing one = no trade."}
            </p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="space-y-1.5">
              <h3 className="text-xs font-bold tracking-wide text-muted uppercase">Get out when</h3>
              <ul className="space-y-1.5">
                {pb.invalidation.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink-2">
                    <span className="text-loss">▸</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
            <section className="space-y-1.5">
              <h3 className="text-xs font-bold tracking-wide text-muted uppercase">Common mistakes</h3>
              <ul className="space-y-1.5">
                {pb.mistakes.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink-2">
                    <span className="text-amber-400">▸</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <p className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2.5 text-sm text-ink-2">
            <span className="font-semibold text-accent">💡 Pro tip:</span> {pb.proTip}
          </p>
        </div>
      )}
    </div>
  );
}
