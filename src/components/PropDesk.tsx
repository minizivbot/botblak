"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { propSummary, type PropTxnLite } from "@/lib/propdesk";
import { fmtMoney, fmtSignedMoney, fmtPct } from "@/lib/format";

export type PropTxnDTO = PropTxnLite & {
  id: string;
  note: string | null;
  accountId: string | null;
  date: string;
};

type AccountOption = { id: string; name: string };

type Props = {
  isPro: boolean;
  currency: string;
  txns: PropTxnDTO[];
  accounts: AccountOption[];
  propAccountCount: number;
  fundedCount: number;
};

const KIND_LABEL: Record<string, string> = { fee: "Fee", reset: "Reset", payout: "Payout" };

export function PropDesk({ isPro, currency, txns, accounts, propAccountCount, fundedCount }: Props) {
  const router = useRouter();
  const [firm, setFirm] = useState("");
  const [kind, setKind] = useState<"fee" | "reset" | "payout">("fee");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const summary = propSummary(txns);
  const passRate = propAccountCount > 0 ? fundedCount / propAccountCount : null;

  if (!isPro) {
    return (
      <section className="card !border-accent/30">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="card-title mb-0 flex items-center gap-2">
            <span>🏦</span> Prop Desk
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">PRO</span>
          </h2>
        </div>
        <p className="mt-2 text-sm text-muted">
          Track your prop business the way no other journal does: every challenge fee, reset and payout in one
          ledger, netted per firm — so you finally know if funded accounts are actually making you money.
        </p>
        <Link href="/pricing" className="btn-primary mt-3 inline-block">Unlock with Pro</Link>
      </section>
    );
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!firm.trim()) return setError("Firm is required.");
    if (!amount || Number(amount) <= 0) return setError("Amount must be a positive number.");

    setSaving(true);
    try {
      const res = await fetch("/api/prop-txns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firm, kind, amount: Number(amount), note: note || null, accountId: accountId || null }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to save");
      setFirm("");
      setAmount("");
      setNote("");
      setKind("fee");
      setAccountId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/prop-txns/${id}`, { method: "DELETE" }).catch(() => null);
    router.refresh();
  }

  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="card-title mb-0 flex items-center gap-2">
          <span>🏦</span> Prop Desk
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">PRO</span>
        </h2>
        <span className="text-xs text-muted">Your prop business — fees in, payouts out</span>
      </div>

      {/* Summary */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-edge bg-raised/40 px-3 py-2.5">
          <p className="text-xs text-muted">Fees paid</p>
          <p className="mt-0.5 text-lg font-bold text-loss">{fmtMoney(summary.totalFees, currency)}</p>
        </div>
        <div className="rounded-xl border border-edge bg-raised/40 px-3 py-2.5">
          <p className="text-xs text-muted">Payouts</p>
          <p className="mt-0.5 text-lg font-bold text-profit">{fmtMoney(summary.totalPayouts, currency)}</p>
        </div>
        <div className="rounded-xl border border-edge bg-raised/40 px-3 py-2.5">
          <p className="text-xs text-muted">Net {summary.roi != null && <>· {fmtPct(summary.roi)} ROI</>}</p>
          <p className={`mt-0.5 text-lg font-bold ${summary.net >= 0 ? "text-profit" : "text-loss"}`}>
            {fmtSignedMoney(summary.net, currency)}
          </p>
        </div>
        <div className="rounded-xl border border-edge bg-raised/40 px-3 py-2.5">
          <p className="text-xs text-muted">Pass rate</p>
          <p className="mt-0.5 text-lg font-bold text-ink">
            {passRate == null ? "—" : fmtPct(passRate)}
          </p>
          <p className="text-[10px] text-muted">{fundedCount}/{propAccountCount} funded</p>
        </div>
      </div>

      {/* Per-firm breakdown */}
      {summary.byFirm.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {summary.byFirm.map((f) => (
            <div key={f.firm} className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{f.firm}</span>
              <span className="flex items-center gap-3 text-xs text-muted">
                <span>{fmtMoney(f.fees, currency)} in</span>
                <span>{fmtMoney(f.payouts, currency)} out</span>
                <span className={`font-semibold tabular-nums ${f.net >= 0 ? "text-profit" : "text-loss"}`}>
                  {fmtSignedMoney(f.net, currency)}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add entry */}
      <form onSubmit={add} className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input
          className="field"
          value={firm}
          onChange={(e) => setFirm(e.target.value)}
          placeholder="Firm (Apex…)"
          list="prop-firm-suggestions"
        />
        <datalist id="prop-firm-suggestions">
          <option value="Apex" />
          <option value="TopStep" />
          <option value="Take Profit Trader" />
          <option value="MyFundedFutures" />
          <option value="Tradeify" />
        </datalist>
        <select className="field" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
          <option value="fee">Fee</option>
          <option value="reset">Reset</option>
          <option value="payout">Payout</option>
        </select>
        <input
          className="field"
          type="number"
          step="any"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
        />
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "…" : "Add"}
        </button>
        <input
          className="field col-span-2 sm:col-span-3"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
        />
        {accounts.length > 0 ? (
          <select className="field col-span-2 sm:col-span-1" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">No account link</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        ) : (
          <div className="hidden sm:block" />
        )}
      </form>
      {error && <p className="mt-2 text-xs text-loss">{error}</p>}

      {/* Ledger */}
      {txns.length > 0 && (
        <ul className="mt-4 divide-y divide-edge/60">
          {txns.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{t.firm}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    t.kind === "payout" ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss"
                  }`}
                >
                  {KIND_LABEL[t.kind] ?? t.kind}
                </span>
                {t.note && <span className="text-xs text-muted">{t.note}</span>}
                <span className="text-xs text-muted">{t.date.slice(0, 10)}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className={`font-semibold tabular-nums ${t.kind === "payout" ? "text-profit" : "text-loss"}`}>
                  {t.kind === "payout" ? "+" : "−"}{fmtMoney(Math.abs(t.amount), currency)}
                </span>
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  aria-label="Delete transaction"
                  className="text-muted hover:text-loss"
                >
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
