"use client";

import { useEffect, useState } from "react";

type Plan = {
  bias: string | null;
  focus: string | null;
  maxTrades: number | null;
  note: string | null;
};

const BIASES = [
  { id: "long", label: "Long 📈", cls: "border-profit/60 bg-profit/15 text-profit" },
  { id: "short", label: "Short 📉", cls: "border-loss/60 bg-loss/15 text-loss" },
  { id: "neutral", label: "Neutral ⏸", cls: "border-edge bg-raised text-ink" },
];

/** Pre-market plan: bias, focus market, trade cap and the actual plan text. */
export function DayPlanCard({ initial }: { initial: Plan | null }) {
  const [bias, setBias] = useState<string | null>(initial?.bias ?? null);
  const [focus, setFocus] = useState(initial?.focus ?? "");
  const [maxTrades, setMaxTrades] = useState(initial?.maxTrades ? String(initial.maxTrades) : "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Fade the "Saved ✓" back to idle.
  useEffect(() => {
    if (state !== "saved") return;
    const t = setTimeout(() => setState("idle"), 2500);
    return () => clearTimeout(t);
  }, [state]);

  async function save() {
    setState("saving");
    const res = await fetch("/api/dayplan", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bias,
        focus: focus.trim() || null,
        maxTrades: maxTrades ? Number(maxTrades) : null,
        note: note.trim() || null,
      }),
    }).catch(() => null);
    setState(res?.ok ? "saved" : "error");
  }

  return (
    <div className="card space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Today&apos;s plan</h2>
        <p className="text-xs text-muted">Written before the session = a plan. Written during = an excuse.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Bias:</span>
        {BIASES.map((b) => (
          <button
            key={b.id}
            onClick={() => setBias(bias === b.id ? null : b.id)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              bias === b.id ? b.cls : "border-edge text-muted hover:text-ink-2"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="field-label">Focus market</label>
          <input className="field" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="MES" maxLength={20} />
        </div>
        <div>
          <label className="field-label">Max trades today</label>
          <input
            className="field"
            value={maxTrades}
            onChange={(e) => setMaxTrades(e.target.value.replace(/\D/g, "").slice(0, 2))}
            placeholder="3"
            inputMode="numeric"
          />
        </div>
      </div>

      <div>
        <label className="field-label">The plan</label>
        <textarea
          className="field min-h-24 resize-y"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={2000}
          placeholder={"Draw on liquidity: PDH at 6,930\nNews: 10:00 CPI — hands off until the dust settles\nSetup I'm hunting: NY AM Silver Bullet"}
        />
      </div>

      <div className="flex items-center gap-3">
        <button className="btn-primary text-sm" onClick={save} disabled={state === "saving"}>
          {state === "saving" ? "Saving…" : "Save plan"}
        </button>
        {state === "saved" && <span className="text-sm text-profit">Saved ✓</span>}
        {state === "error" && <span className="text-sm text-loss">Save failed — try again</span>}
      </div>
    </div>
  );
}
