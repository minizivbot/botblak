"use client";

import { useState } from "react";
import type { TradeDTO } from "@/lib/dto";
import { ICT_SETUPS } from "@/lib/killzones";
import { INSTRUMENTS, findInstrument } from "@/lib/instruments";
import { fmtSignedMoney } from "@/lib/format";

type AccountOption = { id: string; name: string; isCopy: boolean };

type Props = {
  trade: TradeDTO | null; // null = create
  accounts: AccountOption[];
  userConcepts: string[];
  currency: string;
  onClose: () => void;
  onSaved: () => void;
};

function toLocalInput(iso: string | null): string {
  return iso ? iso.slice(0, 16) : "";
}

/** Current time as a datetime-local value (UTC, matching how trades are stored). */
function nowInput(): string {
  return new Date().toISOString().slice(0, 16);
}

export function TradeFormModal({ trade, accounts, userConcepts, currency, onClose, onSaved }: Props) {
  // Existing trades store size = contracts × $/pt; derive contracts back out
  // using the symbol's point value so editing shows a plain contract count.
  const initialContracts = (() => {
    if (!trade) return "";
    const ppt = findInstrument(trade.symbol)?.dollarsPerPoint ?? 1;
    const c = trade.size / ppt;
    return Number.isInteger(c) ? String(c) : String(trade.size); // fall back to raw size for odd data
  })();

  const [form, setForm] = useState({
    symbol: trade?.symbol ?? "",
    direction: trade?.direction ?? "LONG",
    entryPrice: trade?.entryPrice?.toString() ?? "",
    exitPrice: trade?.exitPrice?.toString() ?? "",
    contracts: initialContracts,
    fees: trade?.fees?.toString() ?? "0",
    // New trades start stamped with the current date-time automatically.
    entryDate: trade ? toLocalInput(trade.entryDate) : nowInput(),
    exitDate: toLocalInput(trade?.exitDate ?? null),
    strategy: trade?.strategy ?? "",
    notes: trade?.notes ?? "",
    accountId: trade?.accountId ?? accounts[0]?.id ?? "",
  });
  const [conceptList, setConceptList] = useState<string[]>(userConcepts);
  const [concepts, setConcepts] = useState<string[]>(
    trade?.concepts ? trade.concepts.split(",").map((c) => c.trim()).filter(Boolean) : [],
  );
  const [customConcept, setCustomConcept] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [removeShot, setRemoveShot] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Live sizing: know the symbol's $/point, turn contracts into dollar size,
  // and preview the resulting P&L so the MES-vs-ES difference is obvious.
  const instrument = findInstrument(form.symbol);
  const dollarsPerPoint = instrument?.dollarsPerPoint ?? 1;
  const contractsNum = Number(form.contracts) || 0;
  const computedSize = contractsNum * dollarsPerPoint;
  const previewPnl = (() => {
    const entry = Number(form.entryPrice);
    const exit = Number(form.exitPrice);
    if (!form.exitPrice.trim() || !entry || !exit || !computedSize) return null;
    const perUnit = form.direction === "SHORT" ? entry - exit : exit - entry;
    return perUnit * computedSize - (Number(form.fees) || 0);
  })();

  const toggleConcept = (c: string) =>
    setConcepts((list) => (list.includes(c) ? list.filter((x) => x !== c) : [...list, c]));

  const saveConceptList = (next: string[]) => {
    setConceptList(next);
    // Persist the personal list; failures are non-fatal for the trade itself.
    fetch("/api/concepts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ concepts: next }),
    }).catch(() => null);
  };

  const addCustomConcept = () => {
    const c = customConcept.trim();
    if (!c) return;
    if (!conceptList.includes(c)) saveConceptList([...conceptList, c]);
    if (!concepts.includes(c)) setConcepts((list) => [...list, c]);
    setCustomConcept("");
  };

  const removeConceptFromList = (c: string) => {
    saveConceptList(conceptList.filter((x) => x !== c));
    setConcepts((list) => list.filter((x) => x !== c));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.symbol.trim()) return setError("Symbol is required.");
    if (!form.entryPrice || Number(form.entryPrice) <= 0) return setError("Entry price must be a positive number.");
    if (!form.contracts || contractsNum <= 0) return setError("Contracts must be a positive number.");
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
        size: computedSize,
        fees: Number(form.fees || 0),
        entryDate: new Date(form.entryDate + ":00Z").toISOString(),
        exitDate: hasExitDate ? new Date(form.exitDate + ":00Z").toISOString() : null,
        strategy: form.strategy || null,
        concepts: concepts.length ? concepts.join(", ") : null,
        notes: form.notes || null,
        accountId: form.accountId || null,
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
          {accounts.length > 0 && (
            <div>
              <label className="field-label">Trading account</label>
              <select className="field" value={form.accountId} onChange={set("accountId")}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}{a.isCopy ? " (copy)" : ""}
                  </option>
                ))}
                <option value="">No account</option>
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Symbol *</label>
              <input className="field uppercase" value={form.symbol} onChange={set("symbol")} placeholder="MES, NQ, CL…" list="symbol-suggestions" required />
              <datalist id="symbol-suggestions">
                {INSTRUMENTS.map((i) => (
                  <option key={i.symbol} value={i.symbol}>{i.name}</option>
                ))}
              </datalist>
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
              <label className="field-label">Contracts *</label>
              <input className="field" type="number" step="any" min="0" value={form.contracts} onChange={set("contracts")} placeholder="e.g. 2" required />
              <p className="mt-1 text-xs text-muted">
                {instrument
                  ? `${instrument.name} · $${instrument.dollarsPerPoint}/pt`
                  : form.symbol.trim()
                    ? "Unknown symbol — $1 per point (enter dollar size)"
                    : "Number of contracts / shares"}
              </p>
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

          {contractsNum > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-edge bg-raised/40 px-3 py-2 text-sm">
              <span className="text-muted">
                {contractsNum} {instrument ? instrument.symbol : form.symbol.toUpperCase() || "contracts"} × ${dollarsPerPoint}/pt
                {" = "}
                <span className="text-ink-2">${computedSize.toLocaleString()} / point</span>
              </span>
              {previewPnl != null && (
                <span className={`font-semibold ${previewPnl >= 0 ? "text-profit" : "text-loss"}`}>
                  P&L {fmtSignedMoney(previewPnl, currency)}
                </span>
              )}
            </div>
          )}

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
            <label className="field-label">Concepts used</label>
            <div className="flex flex-wrap gap-1.5">
              {[...new Set([...conceptList, ...concepts])].map((c) => (
                <span
                  key={c}
                  className={`inline-flex items-center gap-1 rounded-full border pl-2.5 text-xs font-medium transition-colors ${
                    concepts.includes(c)
                      ? "border-accent/60 bg-accent/15 text-ink"
                      : "border-edge text-muted hover:border-edge-strong hover:text-ink-2"
                  }`}
                >
                  <button type="button" onClick={() => toggleConcept(c)} aria-pressed={concepts.includes(c)} className="py-1">
                    {c}
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${c} from your concept list`}
                    title="Remove from my list"
                    onClick={() => removeConceptFromList(c)}
                    className="rounded-full px-1.5 py-1 text-muted hover:text-loss"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">Tap to select · × removes it from your personal list.</p>
            <div className="mt-2 flex gap-2">
              <input
                className="field"
                value={customConcept}
                onChange={(e) => setCustomConcept(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomConcept();
                  }
                }}
                placeholder="Add your own concept…"
              />
              <button type="button" className="btn-ghost shrink-0" onClick={addCustomConcept} disabled={!customConcept.trim()}>
                Add
              </button>
            </div>
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
