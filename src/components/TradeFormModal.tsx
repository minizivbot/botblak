"use client";

import { useState } from "react";
import type { TradeDTO } from "@/lib/dto";
import { ICT_SETUPS } from "@/lib/killzones";
import { MISTAKES } from "@/lib/mistakes";
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
  const copyAccounts = accounts.filter((a) => a.isCopy);
  const soloAccounts = accounts.filter((a) => !a.isCopy);
  // New trades default to "all copy accounts" when copy accounts exist, else
  // the first regular account.
  const defaultAccountId = trade?.accountId ?? (copyAccounts.length > 0 ? "__copy__" : soloAccounts[0]?.id ?? accounts[0]?.id ?? "");
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
    rr: trade?.rr != null ? String(trade.rr) : "",
    notes: trade?.notes ?? "",
    accountId: defaultAccountId,
  });
  const [conceptList, setConceptList] = useState<string[]>(userConcepts);
  const [concepts, setConcepts] = useState<string[]>(
    trade?.concepts ? trade.concepts.split(",").map((c) => c.trim()).filter(Boolean) : [],
  );
  const [customConcept, setCustomConcept] = useState("");
  const [mistakes, setMistakes] = useState<string[]>(
    trade?.mistakes ? trade.mistakes.split(",").map((m) => m.trim()).filter(Boolean) : [],
  );
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

  const toggleMistake = (m: string) =>
    setMistakes((list) => (list.includes(m) ? list.filter((x) => x !== m) : [...list, m]));

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

      const base = {
        symbol: form.symbol,
        direction: form.direction,
        entryPrice: Number(form.entryPrice),
        exitPrice: hasExitPrice ? Number(form.exitPrice) : null,
        size: computedSize,
        fees: Number(form.fees || 0),
        entryDate: new Date(form.entryDate + ":00Z").toISOString(),
        exitDate: hasExitDate ? new Date(form.exitDate + ":00Z").toISOString() : null,
        strategy: form.strategy || null,
        rr: form.rr.trim() === "" ? null : Number(form.rr),
        concepts: concepts.length ? concepts.join(", ") : null,
        mistakes: mistakes.length ? mistakes.join(", ") : null,
        notes: form.notes || null,
        screenshotPath,
      };

      // "__copy__" mirrors the trade into every copy account at once; otherwise
      // it goes to the single chosen account.
      const targetIds =
        form.accountId === "__copy__"
          ? accounts.filter((a) => a.isCopy).map((a) => a.id)
          : [form.accountId || null];

      if (trade) {
        const res = await fetch(`/api/trades/${trade.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...base, accountId: form.accountId === "__copy__" ? trade.accountId : form.accountId || null }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Failed to save trade");
      } else {
        for (const accountId of targetIds) {
          const res = await fetch("/api/trades", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...base, accountId }),
          });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(body.error || "Failed to save trade");
        }
      }
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
                {copyAccounts.length > 0 && !trade && (
                  <option value="__copy__">🔁 Copy — all {copyAccounts.length} copy accounts</option>
                )}
                {soloAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
                {copyAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} (copy)</option>
                ))}
                <option value="">No account</option>
              </select>
              {form.accountId === "__copy__" && (
                <p className="mt-1 text-xs text-accent">
                  Saves this trade into all {copyAccounts.length} copy accounts at once.
                </p>
              )}
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

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <label className="field-label">Strategy tag</label>
              <input className="field" value={form.strategy} onChange={set("strategy")} placeholder="Silver Bullet, FVG, Order Block…" list="strategy-suggestions" />
              <datalist id="strategy-suggestions">
                {ICT_SETUPS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div className="w-28">
              <label className="field-label">R:R</label>
              <input
                className="field"
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                value={form.rr}
                onChange={set("rr")}
                placeholder="e.g. 2.5"
              />
              <p className="mt-1 text-[11px] text-muted">reward ÷ risk</p>
            </div>
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
            <label className="field-label">Mistakes</label>
            <div className="flex flex-wrap gap-1.5">
              {MISTAKES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMistake(m)}
                  aria-pressed={mistakes.includes(m)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    mistakes.includes(m)
                      ? "border-loss/60 bg-loss/15 text-ink"
                      : "border-edge text-muted hover:border-edge-strong hover:text-ink-2"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">Tag what went wrong — the dashboard tallies what each mistake costs you.</p>
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
