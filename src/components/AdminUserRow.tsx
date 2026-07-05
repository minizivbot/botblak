"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  username: string;
  email: string | null;
  isAdmin: boolean;
  createdAt: string;
  tradeCount: number;
  accountCount: number;
  pnl: number;
  onLeaderboard: boolean;
  isSelf: boolean;
};

export function AdminUserRow({ row, pnlLabel }: { row: Row; pnlLabel: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState(row.onLeaderboard);

  async function toggleLeaderboard() {
    setBusy(true);
    const next = !shown;
    const res = await fetch(`/api/admin/users/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showOnLeaderboard: next }),
    });
    if (res.ok) setShown(next);
    setBusy(false);
  }

  async function remove() {
    if (!confirm(`Delete user "${row.username}" and ALL their data? This cannot be undone.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/users/${row.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else {
      const b = await res.json().catch(() => ({}));
      alert(b.error || "Delete failed");
      setBusy(false);
    }
  }

  return (
    <tr className="border-b border-edge/50 last:border-0">
      <td className="px-4 py-2.5">
        <Link href={`/u/${encodeURIComponent(row.username)}`} className="font-medium hover:text-accent hover:underline">
          {row.username}
        </Link>
        {row.isAdmin && <span className="ml-2 rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">admin</span>}
        {row.isSelf && <span className="ml-1.5 text-xs text-muted">you</span>}
        {row.email && <p className="text-xs text-muted">{row.email}</p>}
      </td>
      <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${row.pnl >= 0 ? "text-profit" : "text-loss"}`}>{pnlLabel}</td>
      <td className="px-4 py-2.5 text-right tabular-nums text-muted">{row.tradeCount}</td>
      <td className="px-4 py-2.5 text-right text-xs text-muted">{row.createdAt}</td>
      <td className="px-4 py-2.5">
        <div className="flex justify-end gap-3">
          <button onClick={toggleLeaderboard} disabled={busy} className="text-xs text-muted hover:text-ink-2 disabled:opacity-40">
            {shown ? "Hide" : "Show"}
          </button>
          {!row.isSelf && (
            <button onClick={remove} disabled={busy} className="text-xs text-loss hover:underline disabled:opacity-40">
              Delete
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
