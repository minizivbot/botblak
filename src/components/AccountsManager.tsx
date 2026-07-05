"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AccountRow = {
  id: string;
  name: string;
  isCopy: boolean;
  tradeCount: number;
  propStartBalance: number | null;
  propProfitTarget: number | null;
  propMaxDrawdown: number | null;
  propDrawdownType: string | null;
  propMaxDailyLoss: number | null;
};

function PropRulesEditor({ account, onSaved }: { account: AccountRow; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(account.propStartBalance?.toString() ?? "");
  const [target, setTarget] = useState(account.propProfitTarget?.toString() ?? "");
  const [dd, setDd] = useState(account.propMaxDrawdown?.toString() ?? "");
  const [ddType, setDdType] = useState(account.propDrawdownType ?? "trailing");
  const [saving, setSaving] = useState(false);
  const configured = account.propStartBalance != null;

  async function save() {
    setSaving(true);
    const num = (s: string) => (s.trim() === "" ? null : Number(s));
    await fetch(`/api/accounts/${account.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propStartBalance: num(start),
        propProfitTarget: num(target),
        propMaxDrawdown: num(dd),
        propDrawdownType: dd.trim() === "" ? null : ddType,
      }),
    }).catch(() => null);
    setSaving(false);
    setOpen(false);
    onSaved();
  }

  return (
    <div className="mt-2 border-t border-edge/60 pt-2">
      <button onClick={() => setOpen((v) => !v)} className="text-xs font-medium text-accent hover:underline">
        {configured ? "🏦 Prop rules ✓ — edit" : "🏦 Set prop-firm rules"}
      </button>
      {open && (
        <div className="mt-2 space-y-2 rounded-lg border border-edge bg-surface/60 p-3">
          <p className="text-xs text-muted">
            Turn this account into a tracked prop challenge. Leave a field empty to skip it.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="field-label">Account size</label>
              <input className="field" type="number" step="any" value={start} onChange={(e) => setStart(e.target.value)} placeholder="50000" />
            </div>
            <div>
              <label className="field-label">Profit target</label>
              <input className="field" type="number" step="any" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="3000" />
            </div>
            <div>
              <label className="field-label">Max drawdown</label>
              <input className="field" type="number" step="any" value={dd} onChange={(e) => setDd(e.target.value)} placeholder="2000" />
            </div>
            <div>
              <label className="field-label">Drawdown type</label>
              <select className="field" value={ddType} onChange={(e) => setDdType(e.target.value)}>
                <option value="trailing">Trailing</option>
                <option value="static">Static</option>
              </select>
            </div>
          </div>
          <button className="btn-primary w-full text-sm" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save prop rules"}
          </button>
        </div>
      )}
    </div>
  );
}

/** Full account management: create, rename, mark copy, set prop rules, delete. */
export function AccountsManager() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [name, setName] = useState("");
  const [isCopy, setIsCopy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((b) => setAccounts(b.accounts ?? []))
      .catch(() => null);

  useEffect(() => {
    load();
  }, []);

  const refresh = () => {
    load();
    router.refresh();
  };

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, isCopy }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to add account");
      setName("");
      setIsCopy(false);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add account");
    } finally {
      setBusy(false);
    }
  }

  async function rename(a: AccountRow) {
    const next = prompt(`Rename "${a.name}" to:`, a.name)?.trim();
    if (!next || next === a.name) return;
    setError(null);
    const res = await fetch(`/api/accounts/${a.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: next }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Failed to rename account");
      return;
    }
    refresh();
  }

  async function toggleCopy(a: AccountRow) {
    await fetch(`/api/accounts/${a.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCopy: !a.isCopy }),
    }).catch(() => null);
    refresh();
  }

  async function remove(a: AccountRow) {
    if (!confirm(`Delete account "${a.name}"?`)) return;
    setError(null);
    const res = await fetch(`/api/accounts/${a.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Failed to delete account");
      return;
    }
    refresh();
  }

  return (
    <section className="card space-y-3">
      <div>
        <h2 className="text-base font-semibold">Manage accounts</h2>
        <p className="text-sm text-muted">
          Create accounts (personal, prop, copy-trading…), rename them, mark which are copy, and set prop-firm rules.
        </p>
      </div>

      {accounts.map((a) => (
        <div key={a.id} className="rounded-lg border border-edge bg-raised/40 px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {a.name}
                {a.propStartBalance != null && <span className="ml-2 text-xs text-accent">prop</span>}
              </p>
              <p className="text-xs text-muted">{a.tradeCount} trades</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button onClick={() => rename(a)} className="text-xs text-muted hover:text-ink-2" title="Rename">
                Rename
              </button>
              <button
                onClick={() => toggleCopy(a)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  a.isCopy ? "border-accent/60 bg-accent/15 text-ink" : "border-edge text-muted hover:text-ink-2"
                }`}
                title="Toggle copy-trading flag"
              >
                {a.isCopy ? "Copy ✓" : "Copy?"}
              </button>
              <button
                onClick={() => remove(a)}
                className="text-xs text-loss hover:underline disabled:opacity-40"
                disabled={a.tradeCount > 0}
                title={a.tradeCount > 0 ? "Move or delete its trades first" : "Delete account"}
              >
                Delete
              </button>
            </div>
          </div>
          <PropRulesEditor account={a} onSaved={refresh} />
        </div>
      ))}

      <form onSubmit={add} className="flex flex-wrap items-end gap-2 border-t border-edge pt-3">
        <div className="min-w-40 flex-1">
          <label className="field-label" htmlFor="acc-name">New account name</label>
          <input id="acc-name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Prop firm, Copy A…" required maxLength={40} />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-ink-2">
          <input type="checkbox" checked={isCopy} onChange={(e) => setIsCopy(e.target.checked)} className="h-4 w-4 accent-[#3987e5]" />
          Copy account
        </label>
        <button className="btn-primary" type="submit" disabled={busy || !name.trim()}>
          Add account
        </button>
      </form>
      {error && <p className="rounded-lg border border-loss/40 bg-loss/10 px-3 py-2 text-sm text-loss">{error}</p>}
    </section>
  );
}
