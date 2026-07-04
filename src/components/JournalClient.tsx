"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { TradeDTO } from "@/lib/dto";
import { tradePnl } from "@/lib/pnl";
import { fmtSignedMoney, fmtDate } from "@/lib/format";

type Entry = {
  date: string; // YYYY-MM-DD
  mood: number;
  discipline: number;
  notes: string | null;
  lessons: string | null;
};

function RatingInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="flex gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            onClick={() => onChange(n)}
            className={`h-8 w-8 rounded-lg border text-sm font-medium transition-colors ${
              n <= value ? "border-accent bg-accent/20 text-ink" : "border-edge text-muted hover:text-ink-2"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function DayEditor({ date, entry, onDone }: { date: string; entry: Entry | null; onDone: () => void }) {
  const [mood, setMood] = useState(entry?.mood ?? 3);
  const [discipline, setDiscipline] = useState(entry?.discipline ?? 3);
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [lessons, setLessons] = useState(entry?.lessons ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, mood, discipline, notes: notes || null, lessons: lessons || null }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to save entry");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save entry");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 border-t border-edge pt-3">
      <div className="flex flex-wrap gap-6">
        <RatingInput label="Mood (1–5)" value={mood} onChange={setMood} />
        <RatingInput label="Discipline (1–5)" value={discipline} onChange={setDiscipline} />
      </div>
      <div>
        <label className="field-label">Notes on the day</label>
        <textarea className="field min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did the session go?" />
      </div>
      <div>
        <label className="field-label">Lessons learned</label>
        <textarea className="field min-h-16" value={lessons} onChange={(e) => setLessons(e.target.value)} placeholder="What will you do differently?" />
      </div>
      {error && <p className="rounded-lg border border-loss/40 bg-loss/10 px-3 py-2 text-sm text-loss">{error}</p>}
      <div className="flex justify-end">
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save entry"}
        </button>
      </div>
    </div>
  );
}

export function JournalClient({ entries, trades, currency }: { entries: Entry[]; trades: TradeDTO[]; currency: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");

  const entryByDate = useMemo(() => new Map(entries.map((e) => [e.date, e])), [entries]);

  // Group trades by the day they closed (open trades by entry day).
  const tradesByDay = useMemo(() => {
    const map = new Map<string, TradeDTO[]>();
    for (const t of trades) {
      const day = (t.exitDate ?? t.entryDate).slice(0, 10);
      map.set(day, [...(map.get(day) ?? []), t]);
    }
    return map;
  }, [trades]);

  const days = useMemo(() => {
    const all = new Set([...entryByDate.keys(), ...tradesByDay.keys()]);
    if (editing) all.add(editing); // a brand-new date opened from the picker
    return [...all].sort().reverse();
  }, [entryByDate, tradesByDay, editing]);

  return (
    <div className="space-y-3">
      <div className="card flex flex-wrap items-end gap-3">
        <div>
          <label className="field-label" htmlFor="new-entry-date">Write an entry for a date</label>
          <input id="new-entry-date" type="date" className="field w-auto" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
        </div>
        <button className="btn-primary" disabled={!newDate} onClick={() => setEditing(newDate)}>
          Open editor
        </button>
      </div>

      {days.length === 0 && <p className="py-8 text-center text-sm text-muted">No trades or journal entries yet.</p>}

      {days.map((day) => {
        const entry = entryByDate.get(day) ?? null;
        const dayTrades = tradesByDay.get(day) ?? [];
        const dayPnl = dayTrades.reduce((s, t) => s + (tradePnl(t) ?? 0), 0);
        const closedCount = dayTrades.filter((t) => t.exitPrice != null).length;
        const isEditing = editing === day;

        return (
          <section key={day} className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold">{fmtDate(day)}</h2>
                <p className="text-xs text-muted">
                  {dayTrades.length} trade{dayTrades.length === 1 ? "" : "s"}
                  {closedCount > 0 && (
                    <>
                      {" · "}
                      <span className={dayPnl >= 0 ? "text-profit" : "text-loss"}>{fmtSignedMoney(dayPnl, currency)}</span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {entry && (
                  <p className="text-xs text-ink-2">
                    Mood <span className="font-semibold text-ink">{entry.mood}/5</span> · Discipline{" "}
                    <span className="font-semibold text-ink">{entry.discipline}/5</span>
                  </p>
                )}
                <button className="btn-ghost px-3 py-1 text-xs" onClick={() => setEditing(isEditing ? null : day)}>
                  {isEditing ? "Close" : entry ? "Edit entry" : "Add entry"}
                </button>
              </div>
            </div>

            {dayTrades.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {dayTrades.map((t) => {
                  const pnl = tradePnl(t);
                  return (
                    <span key={t.id} className="rounded-lg border border-edge bg-raised px-2 py-1 text-xs" title={t.notes ?? undefined}>
                      <span className="font-medium">{t.symbol}</span>{" "}
                      <span className="text-muted">{t.direction === "LONG" ? "L" : "S"}</span>{" "}
                      {pnl == null ? (
                        <span className="text-accent">open</span>
                      ) : (
                        <span className={pnl >= 0 ? "text-profit" : "text-loss"}>{fmtSignedMoney(pnl, currency)}</span>
                      )}
                    </span>
                  );
                })}
              </div>
            )}

            {entry && !isEditing && (entry.notes || entry.lessons) && (
              <div className="mt-3 space-y-2 border-t border-edge pt-3 text-sm text-ink-2">
                {entry.notes && <p>{entry.notes}</p>}
                {entry.lessons && (
                  <p className="text-xs">
                    <span className="font-medium text-accent">Lesson:</span> {entry.lessons}
                  </p>
                )}
              </div>
            )}

            {isEditing && (
              <div className="mt-3">
                <DayEditor
                  date={day}
                  entry={entry}
                  onDone={() => {
                    setEditing(null);
                    router.refresh();
                  }}
                />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
