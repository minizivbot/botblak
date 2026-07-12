"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fmtSignedMoney, fmtPct } from "@/lib/format";

export type PlaybookStats = {
  id: string;
  name: string;
  emoji: string;
  rules: string[];
  trades: number;
  winRate: number | null;
  pnl: number;
  fullCount: number;
  fullAvg: number | null;
  partialCount: number;
  partialAvg: number | null;
};

const STARTERS: { name: string; emoji: string; rules: string[] }[] = [
  {
    name: "Silver Bullet",
    emoji: "🎯",
    rules: ["Inside 10–11 AM NY window", "Liquidity swept first", "FVG formed after the sweep", "Entry inside the FVG", "Stop beyond the sweep"],
  },
  {
    name: "London Reversal",
    emoji: "🌊",
    rules: ["Asia range marked", "London swept Asia high/low", "Market structure shift confirmed", "Risk under 1R planned"],
  },
];

/** Manage playbooks and read the payoff: full checklist vs. rushed entries. */
export function PlaybooksClient({ stats, readOnly = false }: { stats: PlaybookStats[]; readOnly?: boolean }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📘");
  const [rulesText, setRulesText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function startFrom(s: (typeof STARTERS)[number]) {
    setCreating(true);
    setName(s.name);
    setEmoji(s.emoji);
    setRulesText(s.rules.join("\n"));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const rules = rulesText.split("\n").map((r) => r.trim()).filter(Boolean);
    if (!name.trim()) return setError("Give the playbook a name.");
    if (rules.length === 0) return setError("Write at least one rule (one per line).");

    setSaving(true);
    const res = await fetch("/api/playbooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, emoji, rules }),
    }).catch(() => null);
    setSaving(false);
    const body = await res?.json().catch(() => ({}));
    if (!res?.ok) return setError(body?.error || "Failed to create playbook");
    setCreating(false);
    setName("");
    setEmoji("📘");
    setRulesText("");
    router.refresh();
  }

  async function remove(id: string, pbName: string) {
    if (!confirm(`Delete playbook "${pbName}"? Trades keep their data.`)) return;
    await fetch(`/api/playbooks/${id}`, { method: "DELETE" }).catch(() => null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {stats.length === 0 && !creating && (
        <section className="card">
          <p className="text-sm text-ink-2">No playbooks yet. Start from a template or build your own:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button key={s.name} type="button" className="btn-ghost text-sm" onClick={() => startFrom(s)} disabled={readOnly}>
                {s.emoji} {s.name}
              </button>
            ))}
            <button type="button" className="btn-primary text-sm" onClick={() => setCreating(true)} disabled={readOnly}>
              + New playbook
            </button>
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {stats.map((p) => (
          <section key={p.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">{p.emoji} {p.name}</h2>
                <p className="text-xs text-muted">
                  {p.trades} trade{p.trades === 1 ? "" : "s"}
                  {p.winRate != null && <> · {fmtPct(p.winRate)} win</>}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-lg font-bold tabular-nums ${p.pnl > 0 ? "text-profit" : p.pnl < 0 ? "text-loss" : "text-ink-2"}`}>
                  {p.trades ? fmtSignedMoney(p.pnl) : "—"}
                </span>
                {!readOnly && (
                  <button type="button" onClick={() => remove(p.id, p.name)} aria-label={`Delete ${p.name}`} className="text-muted hover:text-loss">✕</button>
                )}
              </div>
            </div>

            <ul className="mt-3 space-y-1">
              {p.rules.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
                  <span className="mt-0.5 text-xs text-muted">{i + 1}.</span> {r}
                </li>
              ))}
            </ul>

            {/* The payoff: checklist discipline in dollars */}
            {(p.fullCount > 0 || p.partialCount > 0) && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-profit/30 bg-profit/5 px-3 py-2">
                  <p className="text-xs text-muted">Full checklist · {p.fullCount}</p>
                  <p className={`text-sm font-bold ${p.fullAvg != null && p.fullAvg >= 0 ? "text-profit" : "text-loss"}`}>
                    {p.fullAvg == null ? "—" : `${fmtSignedMoney(p.fullAvg)} avg`}
                  </p>
                </div>
                <div className="rounded-lg border border-loss/30 bg-loss/5 px-3 py-2">
                  <p className="text-xs text-muted">Rules skipped · {p.partialCount}</p>
                  <p className={`text-sm font-bold ${p.partialAvg != null && p.partialAvg >= 0 ? "text-profit" : "text-loss"}`}>
                    {p.partialAvg == null ? "—" : `${fmtSignedMoney(p.partialAvg)} avg`}
                  </p>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>

      {stats.length > 0 && !creating && !readOnly && (
        <button type="button" className="btn-ghost text-sm" onClick={() => setCreating(true)}>+ New playbook</button>
      )}

      {creating && (
        <form onSubmit={create} className="card max-w-xl space-y-3">
          <h2 className="card-title mb-0">New playbook</h2>
          <div className="flex gap-2">
            <input className="field !w-16 text-center" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} aria-label="Emoji" />
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name — e.g. A+ Silver Bullet" maxLength={40} />
          </div>
          <div>
            <label className="field-label">Rules — one per line</label>
            <textarea
              className="field min-h-28"
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              placeholder={"Liquidity swept first\nFVG formed after the sweep\nEntry inside the FVG"}
            />
          </div>
          {error && <p className="text-sm text-loss">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm" disabled={saving}>{saving ? "Saving…" : "Create playbook"}</button>
            <button type="button" className="btn-ghost text-sm" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
