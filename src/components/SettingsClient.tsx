"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Broker = { id: string; label: string; configured: boolean };
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
          <PropRulesEditor
            account={a}
            onSaved={() => {
              load();
              router.refresh();
            }}
          />
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

function ProfileCard() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [initial, setInitial] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((b) => {
        setUsername(b.user?.username ?? "");
        setInitial(b.user?.username ?? "");
      })
      .catch(() => null);
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to update username");
      setInitial(body.user.username);
      setMsg({ ok: true, text: "Username updated." });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Failed to update username" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="card max-w-lg space-y-3">
      <h2 className="text-base font-semibold">Profile</h2>
      <div>
        <label className="field-label" htmlFor="p-username">Username</label>
        <div className="flex gap-2">
          <input
            id="p-username"
            className="field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={24}
          />
          <button className="btn-primary shrink-0" type="submit" disabled={saving || username === initial || !username.trim()}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">This is the name shown on the leaderboard. Letters, numbers, and . _ - only.</p>
      </div>
      {msg && (
        <p className={`rounded-lg border px-3 py-2 text-sm ${msg.ok ? "border-profit/40 bg-profit/10 text-profit" : "border-loss/40 bg-loss/10 text-loss"}`}>
          {msg.text}
        </p>
      )}
    </form>
  );
}

export function SettingsClient() {
  const [startingBalance, setStartingBalance] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [maxDailyLoss, setMaxDailyLoss] = useState("");
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
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
        setMaxDailyLoss(b.settings?.maxDailyLoss != null ? String(b.settings.maxDailyLoss) : "");
        setShowOnLeaderboard(b.settings?.showOnLeaderboard !== false);
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
        body: JSON.stringify({
          startingBalance: Number(startingBalance),
          currency,
          maxDailyLoss: maxDailyLoss.trim() === "" ? null : Number(maxDailyLoss),
          showOnLeaderboard,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to save settings");
      setMessage({ ok: true, text: "Settings saved." });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <ProfileCard />

      <form onSubmit={save} className="card max-w-lg space-y-4">
        <h2 className="text-base font-semibold">Account &amp; risk</h2>
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
        <div>
          <label className="field-label" htmlFor="s-maxloss">Daily loss limit (risk guard)</label>
          <input
            id="s-maxloss"
            className="field"
            type="number"
            step="any"
            min="0"
            placeholder="e.g. 500 — leave empty to disable"
            value={maxDailyLoss}
            onChange={(e) => setMaxDailyLoss(e.target.value)}
            disabled={!loaded}
          />
          <p className="mt-1 text-xs text-muted">
            When today&apos;s losses reach this amount, the dashboard shows a big STOP banner. Your future self says thanks.
          </p>
        </div>
        <label className="flex items-start gap-2.5 rounded-lg border border-edge bg-raised/40 px-3 py-2.5">
          <input
            type="checkbox"
            checked={showOnLeaderboard}
            onChange={(e) => setShowOnLeaderboard(e.target.checked)}
            disabled={!loaded}
            className="mt-0.5 h-4 w-4 accent-[#3987e5]"
          />
          <span className="text-sm">
            <span className="font-medium text-ink">Show me on the public leaderboard</span>
            <span className="block text-xs text-muted">Uncheck to keep your stats private.</span>
          </span>
        </label>
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
        <h2 className="text-base font-semibold">Broker connections</h2>
        <p className="text-sm text-muted">
          Connect and sync your brokers on the{" "}
          <Link href="/import" className="text-accent hover:underline">Import &amp; Sync</Link> page — credentials are
          verified and stored encrypted there.
        </p>
        {brokers.map((b) => (
          <div key={b.id} className="flex items-center justify-between rounded-lg border border-edge bg-raised/40 px-3 py-2">
            <span className="text-sm font-medium">{b.label}</span>
            <span className={`text-xs font-medium ${b.configured ? "text-profit" : "text-muted"}`}>
              {b.configured ? "● Connected" : "○ Not connected"}
            </span>
          </div>
        ))}
        {loaded && brokers.length === 0 && <p className="text-sm text-muted">No broker adapters registered.</p>}
      </section>
    </div>
  );
}
