"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  username: string;
  email: string | null;
  isAdmin: boolean;
  isPro: boolean;
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
  const [isAdmin, setIsAdmin] = useState(row.isAdmin);
  const [isPro, setIsPro] = useState(row.isPro);

  async function update(body: Record<string, unknown>): Promise<boolean> {
    setBusy(true);
    const res = await fetch(`/api/admin/users/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      alert(b.error || "Update failed");
    }
    setBusy(false);
    return res.ok;
  }

  async function toggleLeaderboard() {
    if (await update({ showOnLeaderboard: !shown })) setShown((v) => !v);
  }

  async function toggleAdmin() {
    const next = !isAdmin;
    const warning = next
      ? `Make "${row.username}" an admin? They'll see the admin panel and can manage users, support and site settings.`
      : `Remove admin access from "${row.username}"?`;
    if (!confirm(warning)) return;
    if (await update({ isAdmin: next })) setIsAdmin(next);
  }

  async function togglePro() {
    if (await update({ plan: isPro ? "free" : "pro" })) setIsPro((v) => !v);
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

  const isDemo = row.username === "demo";

  return (
    <tr className="border-b border-edge/50 last:border-0">
      <td className="px-4 py-2.5">
        <Link href={`/u/${encodeURIComponent(row.username)}`} className="font-medium hover:text-accent hover:underline">
          {row.username}
        </Link>
        {isAdmin && <span className="ml-2 rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">admin</span>}
        {isPro && <span className="ml-1.5 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">PRO</span>}
        {row.isSelf && <span className="ml-1.5 text-xs text-muted">you</span>}
        {row.email && <p className="text-xs text-muted">{row.email}</p>}
      </td>
      <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${row.pnl >= 0 ? "text-profit" : "text-loss"}`}>{pnlLabel}</td>
      <td className="px-4 py-2.5 text-right tabular-nums text-muted">{row.tradeCount}</td>
      <td className="px-4 py-2.5 text-right text-xs text-muted">{row.createdAt}</td>
      <td className="px-4 py-2.5">
        <div className="flex flex-wrap justify-end gap-x-3 gap-y-1">
          <button onClick={togglePro} disabled={busy} className="text-xs text-amber-400/90 hover:text-amber-300 disabled:opacity-40">
            {isPro ? "Remove Pro" : "Give Pro"}
          </button>
          {!row.isSelf && !isDemo && (
            <button onClick={toggleAdmin} disabled={busy} className="text-xs text-accent hover:underline disabled:opacity-40">
              {isAdmin ? "Remove admin" : "Make admin"}
            </button>
          )}
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
