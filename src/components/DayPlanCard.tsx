"use client";

import { useState } from "react";

type Plan = { bias: string | null; focus: string | null; maxTrades: number | null; note: string | null };

const BIASES = [
  { id: "long", label: "Long", cls: "border-profit/50 bg-profit/10 text-profit" },
  { id: "short", label: "Short", cls: "border-loss/50 bg-loss/10 text-loss" },
  { id: "neutral", label: "Neutral", cls: "border-accent/50 bg-accent/10 text-accent" },
] as const;

/**
 * The pre-market plan for today: bias, focus market, max trades, and the plan
 * itself. Saves silently on blur/click so filling it in feels effortless.
 */
export function DayPlanCard({ initial, readOnly = false }: { initial: Plan | null; readOnly?: boolean }) {
  const [bias, setBias] = useState<string | null>(initial?.bias ?? null);
  const [focus, setFocus] = useState(initial?.focus ?? "");
  const [maxTrades, setMaxTrades] = useState(initial?.maxTrades != null ? String(initial.maxTrades) : "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  async function save(next?: Partial<{ bias: string | null }>) {
    if (readOnly) return;
    setState("saving");
    const body = {
      bias: next?.bias !== undefined ? next.bias : bias,
      focus: focus || null,
      maxTrades: maxTrades === "" ? null : Number(maxTrades),
      note: note || null,
    };
    const res = await fetch("/api/day-plan", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    setState(res?.ok ? "saved" : "idle");
    if (res?.ok) setTimeout(() => setState("idle"), 1500);
  }

  const pickBias = (id: string) => {
    if (readOnly) return;
    const nextBias = bias === id ? null : id;
    setBias(nextBias);
    save({ bias: nextBias });
  };

  return (
    <section className="card">
      <div className="flex items-center justify-between">
        <h2 className="card-title mb-0">Today&apos;s plan</h2>
        <span className="text-xs text-muted">{state === "saving" ? "Saving…" : state === "saved" ? "Saved ✓" : "Auto-saves"}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {BIASES.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => pickBias(b.id)}
            disabled={readOnly}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-default ${
              bias === b.id ? b.cls : "border-edge text-muted hover:border-edge-strong hover:text-ink-2"
            }`}
          >
            {b.label}
          </button>
        ))}
        <input
          className="field !w-28"
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          onBlur={() => save()}
          placeholder="Focus: MNQ"
          disabled={readOnly}
        />
        <input
          className="field !w-32"
          type="number"
          min="1"
          value={maxTrades}
          onChange={(e) => setMaxTrades(e.target.value)}
          onBlur={() => save()}
          placeholder="Max trades"
          disabled={readOnly}
        />
      </div>

      <textarea
        className="field mt-2 min-h-20"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => save()}
        placeholder="Draw on liquidity, news times, invalidation… write the plan before the session."
        disabled={readOnly}
      />
    </section>
  );
}
