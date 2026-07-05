"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { TradeDTO } from "@/lib/dto";
import { tradePnl } from "@/lib/pnl";
import { killzone } from "@/lib/killzones";
import { fmtMoney, fmtSignedMoney, fmtDateTime, fmtNum } from "@/lib/format";
import { TradeFormModal } from "./TradeFormModal";

type AccountOption = { id: string; name: string; isCopy: boolean };

export function TradesClient({
  trades,
  currency,
  accounts,
  userConcepts,
}: {
  trades: TradeDTO[];
  currency: string;
  accounts: AccountOption[];
  userConcepts: string[];
}) {
  const router = useRouter();
  const search = useSearchParams().toString();
  const [modal, setModal] = useState<{ open: boolean; trade: TradeDTO | null }>({ open: false, trade: null });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(t: TradeDTO) {
    if (!confirm(`Delete ${t.direction} ${t.symbol} from ${fmtDateTime(t.entryDate)}?`)) return;
    setDeleting(t.id);
    setError(null);
    try {
      const res = await fetch(`/api/trades/${t.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Delete failed");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted">{trades.length} trades</p>
        <div className="flex gap-2">
          <a
            className="btn-ghost"
            href={`/api/export/csv${search ? `?${search}` : ""}`}
            download
          >
            Export CSV
          </a>
          <button className="btn-primary" onClick={() => setModal({ open: true, trade: null })}>
            + Add trade
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg border border-loss/40 bg-loss/10 px-3 py-2 text-sm text-loss">{error}</p>}

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-edge text-left text-xs text-muted">
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-2 py-3 font-medium">Side</th>
              <th className="px-2 py-3 font-medium">Entry</th>
              <th className="px-2 py-3 font-medium">Exit</th>
              <th className="px-2 py-3 text-right font-medium">Size</th>
              <th className="px-2 py-3 text-right font-medium">Fees</th>
              <th className="px-2 py-3 text-right font-medium">P&L</th>
              <th className="px-2 py-3 font-medium">Strategy</th>
              <th className="px-2 py-3 font-medium">Shot</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-muted">
                  No trades match the current filters.
                </td>
              </tr>
            )}
            {trades.map((t) => {
              const pnl = tradePnl(t);
              return (
                <tr key={t.id} className="border-b border-edge/50 last:border-0 hover:bg-raised/40" title={t.notes ?? undefined}>
                  <td className="px-4 py-2.5 font-medium">
                    {t.symbol}
                    {t.accountName && (
                      <span className={`mt-0.5 block text-xs font-normal ${t.accountIsCopy ? "text-accent" : "text-muted"}`}>
                        {t.accountName}{t.accountIsCopy ? " · copy" : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                        t.direction === "LONG" ? "bg-profit-mark/15 text-profit" : "bg-loss/15 text-loss"
                      }`}
                    >
                      {t.direction === "LONG" ? "Long" : "Short"}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 whitespace-nowrap text-ink-2">
                    {fmtNum(t.entryPrice, 4)}
                    <span className="block text-xs text-muted">
                      {fmtDateTime(t.entryDate)} · <span className="text-accent/80">{killzone(t.entryDate)}</span>
                    </span>
                  </td>
                  <td className="px-2 py-2.5 whitespace-nowrap text-ink-2">
                    {t.exitPrice != null ? (
                      <>
                        {fmtNum(t.exitPrice, 4)}
                        <span className="block text-xs text-muted">{t.exitDate ? fmtDateTime(t.exitDate) : ""}</span>
                      </>
                    ) : (
                      <span className="rounded bg-accent/15 px-1.5 py-0.5 text-xs text-accent">Open</span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums text-ink-2">{fmtNum(t.size, 4)}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums text-ink-2">{fmtMoney(t.fees, currency)}</td>
                  <td className={`px-2 py-2.5 text-right font-medium tabular-nums ${pnl == null ? "text-muted" : pnl >= 0 ? "text-profit" : "text-loss"}`}>
                    {pnl == null ? "—" : fmtSignedMoney(pnl, currency)}
                  </td>
                  <td className="px-2 py-2.5 text-ink-2">
                    {t.strategy ?? <span className="text-muted">—</span>}
                    {t.concepts && (
                      <span className="mt-0.5 block max-w-40 truncate text-xs text-muted" title={t.concepts}>
                        {t.concepts}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2.5">
                    {t.screenshotPath ? (
                      <a href={t.screenshotPath} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                        view
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button className="text-xs text-accent hover:underline" onClick={() => setModal({ open: true, trade: t })}>
                      Edit
                    </button>
                    <button
                      className="ml-3 text-xs text-loss hover:underline disabled:opacity-50"
                      disabled={deleting === t.id}
                      onClick={() => remove(t)}
                    >
                      {deleting === t.id ? "…" : "Delete"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <TradeFormModal
          trade={modal.trade}
          accounts={accounts}
          userConcepts={userConcepts}
          onClose={() => setModal({ open: false, trade: null })}
          onSaved={() => {
            setModal({ open: false, trade: null });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
