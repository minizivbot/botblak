"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Broker = { id: string; label: string; configured: boolean };
type AccountRow = { id: string; name: string; isCopy: boolean; tradeCount: number };

function AccountsManager() {
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
      await load();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add account");
    } finally {
      setBusy(false);
    }
  }

  async function toggleCopy(a: AccountRow) {
    await fetch(`/api/accounts/${a.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCopy: !a.isCopy }),
    }).catch(() => null);
    await load();
    router.refresh();
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
    await load();
    router.refresh();
  }

  return (
    <section className="card max-w-lg space-y-3">
      <h2 className="text-base font-semibold">Trading accounts</h2>
      <p className="text-sm text-muted">
        Separate your accounts (personal, prop, copy-trading…). Mark copy accounts and filter the
        dashboard by <span className="text-ink-2">All / Copy only / a single account</span>.
      </p>

      {accounts.map((a) => (
        <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-edge bg-raised/40 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{a.name}</p>
            <p className="text-xs text-muted">{a.tradeCount} trades</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
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
          Add
        </button>
      </form>
      {error && <p className="rounded-lg border border-loss/40 bg-loss/10 px-3 py-2 text-sm text-loss">{error}</p>}
    </section>
  );
}

export function SettingsClient() {
  const [startingBalance, setStartingBalance] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((b) => {
        setStartingBalance(String(b.settings?.startingBalance ?? 10000));
        setCurrency(b.settings?.currency ?? "USD");
        setBrokers(b.brokers ?? []);
        setLoaded(true);
      })
      .catch(() => {
        setMessage({ ok: false, text: "Failed to load settings." });
        setLoaded(true);
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startingBalance: Number(startingBalance), currency }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to save settings");
      setMessage({ ok: true, text: "Settings saved. Dashboard stats now use the new starting balance." });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="card max-w-lg space-y-4">
        <h2 className="text-base font-semibold">Account</h2>
        <div>
          <label className="field-label" htmlFor="s-balance">Starting balance</label>
          <input
            id="s-balance"
            className="field"
            type="number"
            step="any"
            min="0"
            value={startingBalance}
            onChange={(e) => setStartingBalance(e.target.value)}
            disabled={!loaded}
            required
          />
          <p className="mt-1 text-xs text-muted">Used as the base of the equity curve and drawdown calculations.</p>
        </div>
        <div>
          <label className="field-label" htmlFor="s-currency">Currency</label>
          <select id="s-currency" className="field" value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={!loaded}>
            {["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "ILS"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {message && (
          <p
            className={`rounded-lg border px-3 py-2 text-sm ${
              message.ok ? "border-profit/40 bg-profit/10 text-profit" : "border-loss/40 bg-loss/10 text-loss"
            }`}
          >
            {message.text}
          </p>
        )}
        <button className="btn-primary" type="submit" disabled={saving || !loaded}>
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>

      <AccountsManager />

      <section className="card max-w-lg space-y-3">
        <h2 className="text-base font-semibold">Broker API keys</h2>
        <p className="text-sm text-muted">
          Keys are read from <code className="text-ink-2">.env</code> on the server and are{" "}
          <span className="text-ink-2">never sent to the browser</span> — this page only shows whether they are set.
          Edit <code className="text-ink-2">.env</code> and restart the dev server to change them (see README).
        </p>
        {brokers.map((b) => (
          <div key={b.id} className="flex items-center justify-between rounded-lg border border-edge bg-raised/40 px-3 py-2">
            <span className="text-sm font-medium">{b.label}</span>
            <span className={`text-xs font-medium ${b.configured ? "text-profit" : "text-muted"}`}>
              {b.configured ? "Configured" : "Not configured"}
            </span>
          </div>
        ))}
        {loaded && brokers.length === 0 && <p className="text-sm text-muted">No broker adapters registered.</p>}
      </section>
    </div>
  );
}
