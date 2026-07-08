"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PushToggle } from "./PushToggle";

type Broker = { id: string; label: string; configured: boolean };
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
        <p className="mt-1 text-xs text-muted">This is the name shown on your public profile. Letters, numbers, and . _ - only.</p>
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
            <span className="font-medium text-ink">Public profile</span>
            <span className="block text-xs text-muted">
              Let others view your profile page and shared stat cards. Uncheck to keep your stats private.
            </span>
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

      <section className="card max-w-lg space-y-3">
        <h2 className="text-base font-semibold">Notifications</h2>
        <PushToggle />
      </section>

      <section className="card max-w-lg space-y-2">
        <h2 className="text-base font-semibold">Trading accounts</h2>
        <p className="text-sm text-muted">
          Create and manage your accounts (and prop-firm rules) on the{" "}
          <Link href="/accounts" className="text-accent hover:underline">Accounts</Link> page.
        </p>
      </section>

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

      <DangerZone />
    </div>
  );
}

function DangerZone() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    if (!confirm("Delete your account and ALL your data permanently? This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure? Every trade, journal entry, and account will be erased.")) return;
    setDeleting(true);
    setError(null);
    const res = await fetch("/api/profile", { method: "DELETE" });
    if (res.ok) {
      router.push("/register");
      router.refresh();
    } else {
      const b = await res.json().catch(() => ({}));
      setError(b.error || "Failed to delete account");
      setDeleting(false);
    }
  }

  return (
    <section className="card max-w-lg space-y-3 !border-loss/30">
      <h2 className="text-base font-semibold text-loss">Danger zone</h2>
      <p className="text-sm text-muted">
        Permanently delete your account and everything in it — trades, journal, accounts, broker connections. This
        can&apos;t be undone.
      </p>
      {error && <p className="rounded-lg border border-loss/40 bg-loss/10 px-3 py-2 text-sm text-loss">{error}</p>}
      <button
        onClick={deleteAccount}
        disabled={deleting}
        className="rounded-lg border border-loss/50 px-4 py-2 text-sm font-semibold text-loss transition-colors hover:bg-loss/10 disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "Delete my account"}
      </button>
    </section>
  );
}
