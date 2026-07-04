"use client";

import { useState } from "react";
import type { TradeDTO } from "@/lib/dto";
import { ICT_SETUPS } from "@/lib/killzones";

type Props = {
  trade: TradeDTO | null; // null = create
  onClose: () => void;
  onSaved: () => void;
};

function toLocalInput(iso: string | null): string {
  return iso ? iso.slice(0, 16) : "";
}

export function TradeFormModal({ trade, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    symbol: trade?.symbol ?? "",
    direction: trade?.direction ?? "LONG",
    entryPrice: trade?.entryPrice?.toString() ?? "",
    exitPrice: trade?.exitPrice?.toString() ?? "",
    size: trade?.size?.toString() ?? "",
    fees: trade?.fees?.toString() ?? "0",
    entryDate: toLocalInput(trade?.entryDate ?? null),
    exitDate: toLocalInput(trade?.exitDate ?? null),
    strategy: trade?.strategy ?? "",
    notes: trade?.notes ?? "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [removeShot, setRemoveShot] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.symbol.trim()) return setError("Symbol is required.");
    if (!form.entryPrice || Number(form.entryPrice) <= 0) return setError("Entry price must be a positive number.");
    if (!form.size || Number(form.size) <= 0) return setError("Size must be a positive number.");
    if (!form.entryDate) return setError("Entry date is required.");
    const hasExitPrice = form.exitPrice.trim() !== "";
    const hasExitDate = form.exitDate.trim() !== "";
    if (hasExitPrice !== hasExitDate) return setError("Provide both exit price and exit date, or neither (open trade).");

    setSaving(true);
    try {
      let screenshotPath = removeShot ? null : (trade?.screenshotPath ?? null);
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        const upBody = await up.json().catch(() => ({}));
        if (!up.ok) throw new Error(upBody.error || "Screenshot upload failed");
        screenshotPath = upBody.path;
      }

      const payload = {
        symbol: form.symbol,
        direction: form.direction,
        entryPrice: Number(form.entryPrice),
        exitPrice: hasExitPrice ? Number(form.exitPrice) : null,
        size: Number(form.size),
        fees: Number(form.fees || 0),
        entryDate: new Date(form.entryDate + ":00Z").toISOString(),
        exitDate: hasExitDate ? new Date(form.exitDate + ":00Z").toISOString() : null,
        strategy: form.strategy || null,
        notes: form.notes || null,
        screenshotPath,
      };

      const res = await fetch(trade ? `/api/trades/${trade.id}` : "/api/trades", {
        method: trade ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to save trade");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center" onClick={onClose}>
      <div className="card w-full max-w-lg" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{trade ? "Edit trade" : "Add trade"}</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">✕</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Symbol *</label>
              <input className="field uppercase" value={form.symbol} onChange={set("symbol")} placeholder="MES, NQ, CL…" required />
            </div>
            <div>
              <label className="field-label">Direction *</label>
              <select className="field" value={form.direction} onChange={set("direction")}>
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
            </div>
            <div>
              <label className="field-label">Entry price *</label>
              <input className="field" type="number" step="any" min="0" value={form.entryPrice} onChange={set("entryPrice")} required />
            </div>
            <div>
              <label className="field-label">Exit price</label>
              <input className="field" type="number" step="any" min="0" value={form.exitPrice} onChange={set("exitPrice")} placeholder="leave empty if open" />
            </div>
            <div>
              <label className="field-label">Size *</label>
              <input className="field" type="number" step="any" min="0" value={form.size} onChange={set("size")} required />
              <p className="mt-1 text-xs text-muted">Futures: contracts × $/pt (2 MES = 10)</p>
            </div>
            <div>
              <label className="field-label">Fees</label>
              <input className="field" type="number" step="any" min="0" value={form.fees} onChange={set("fees")} />
            </div>
            <div>
              <label className="field-label">Entry date-time *</label>
              <input className="field" type="datetime-local" value={form.entryDate} onChange={set("entryDate")} required />
            </div>
            <div>
              <label className="field-label">Exit date-time</label>
              <input className="field" type="datetime-local" value={form.exitDate} onChange={set("exitDate")} />
            </div>
          </div>

          <div>
            <label className="field-label">Strategy tag</label>
            <input className="field" value={form.strategy} onChange={set("strategy")} placeholder="Silver Bullet, FVG, Order Block…" list="strategy-suggestions" />
            <datalist id="strategy-suggestions">
              {ICT_SETUPS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="field-label">Notes</label>
            <textarea className="field min-h-20" value={form.notes} onChange={set("notes")} placeholder="Setup, execution, review…" />
          </div>

          <div>
            <label className="field-label">Screenshot</label>
            {trade?.screenshotPath && !removeShot && !file && (
              <div className="mb-2 flex items-center gap-3 text-xs text-ink-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={trade.screenshotPath} alt="Current screenshot" className="h-12 rounded border border-edge" />
                <button type="button" className="text-loss hover:underline" onClick={() => setRemoveShot(true)}>
                  Remove
                </button>
              </div>
            )}
            <input
              className="field"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1 text-xs text-muted">PNG/JPEG/WebP/GIF, max 5 MB.</p>
          </div>

          {error && <p className="rounded-lg border border-loss/40 bg-loss/10 px-3 py-2 text-sm text-loss">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : trade ? "Save changes" : "Add trade"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
