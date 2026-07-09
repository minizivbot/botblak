"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PushToggle } from "./PushToggle";

type Broker = { id: string; label: string; configured: boolean };
type NotifyPrefs = { morning: boolean; daily: boolean; weekly: boolean; alerts: boolean };

const NOTIFY_ITEMS: { key: keyof NotifyPrefs; label: string; desc: string }[] = [
  { key: "morning", label: "Morning news briefing", desc: "Weekday heads-up when today has red-folder events." },
  { key: "daily", label: "End-of-day scorecard", desc: "Your P&L, trades and streak after the close." },
  { key: "weekly", label: "Weekly recap", desc: "Friday summary of the week you just traded." },
  { key: "alerts", label: "Risk & milestone alerts", desc: "Daily-loss limit hit, prop challenge passed, new achievement, site announcements." },
];
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

export function SettingsClient({ isPro = false }: { isPro?: boolean }) {
  const router = useRouter();
  const [startingBalance, setStartingBalance] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [maxDailyLoss, setMaxDailyLoss] = useState("");
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const [accent, setAccent] = useState<string | null>(null);
  const [notify, setNotify] = useState<NotifyPrefs>({ morning: true, daily: true, weekly: true, alerts: true });
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
        setAccent(b.settings?.accent ?? null);
        setNotify({
          morning: b.settings?.notifyMorning !== false,
          daily: b.settings?.notifyDaily !== false,
          weekly: b.settings?.notifyWeekly !== false,
          alerts: b.settings?.notifyAlerts !== false,
        });
        setBrokers(b.brokers ?? []);
        setLoaded(true);
      })
      .catch(() => {
        setMessage({ ok: false, text: "Failed to load settings." });
        setLoaded(true);
      });
  }, []);

  // Notification preferences save instantly on toggle (no Save button needed).
  async function toggleNotify(key: keyof NotifyPrefs) {
    const next = { ...notify, [key]: !notify[key] };
    setNotify(next);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startingBalance: Number(startingBalance) || 10000,
        currency,
        maxDailyLoss: maxDailyLoss.trim() === "" ? null : Number(maxDailyLoss),
        showOnLeaderboard,
        notifyMorning: next.morning,
        notifyDaily: next.daily,
        notifyWeekly: next.weekly,
        notifyAlerts: next.alerts,
      }),
    }).catch(() => null);
  }

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
          accent,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to save settings");
      setMessage({ ok: true, text: "Settings saved." });
      router.refresh(); // re-render the layout so a new theme applies immediately
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  }

  async function saveAccent(id: string | null) {
    setAccent(id);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startingBalance: Number(startingBalance) || 10000,
        currency,
        maxDailyLoss: maxDailyLoss.trim() === "" ? null : Number(maxDailyLoss),
        showOnLeaderboard,
        accent: id,
      }),
    }).catch(() => null);
    router.refresh(); // repaint the app with the new accent right away
  }

  const THEMES: { id: string | null; label: string; color: string }[] = [
    { id: null, label: "Classic Blue", color: "#3987e5" },
    { id: "gold", label: "Gold", color: "#e5b53a" },
    { id: "violet", label: "Violet", color: "#8b5cf6" },
    { id: "emerald", label: "Emerald", color: "#10b981" },
    { id: "rose", label: "Rose", color: "#f43f5e" },
    { id: "ice", label: "Ice", color: "#22d3ee" },
  ];

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
        <h2 className="flex items-center gap-2 text-base font-semibold">
          Theme
          <span className="rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">PRO</span>
        </h2>
        <p className="text-sm text-muted">
          {isPro
            ? "Pick your accent color — it repaints the whole app instantly. Hits different in gold."
            : "Pro members repaint the whole app in their color. Upgrade to unlock."}
        </p>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => isPro && saveAccent(t.id)}
              disabled={!isPro || !loaded}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                accent === t.id && isPro
                  ? "border-accent bg-accent/15 text-ink"
                  : "border-edge text-muted hover:text-ink-2"
              } ${!isPro ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <span className="h-3.5 w-3.5 rounded-full" style={{ background: t.color }} />
              {t.label}
            </button>
          ))}
        </div>
        {!isPro && (
          <Link href="/pricing" className="inline-block text-xs text-accent hover:underline">
            See Pro plans →
          </Link>
        )}
      </section>

      <section className="card max-w-lg space-y-3">
        <h2 className="text-base font-semibold">Notifications</h2>
        <PushToggle />
        <div className="space-y-2 border-t border-edge pt-3">
          <p className="text-xs text-muted">Choose which push notifications you get:</p>
          {NOTIFY_ITEMS.map((item) => (
            <label key={item.key} className="flex items-start gap-2.5 rounded-lg border border-edge bg-raised/40 px-3 py-2.5">
              <input
                type="checkbox"
                checked={notify[item.key]}
                onChange={() => toggleNotify(item.key)}
                disabled={!loaded}
                className="mt-0.5 h-4 w-4 accent-[#3987e5]"
              />
              <span className="text-sm">
                <span className="font-medium text-ink">{item.label}</span>
                <span className="block text-xs text-muted">{item.desc}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      {isPro && <BillingCard />}

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

function BillingCard() {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function openPortal() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/billing/portal", { method: "POST" }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy(false);
    if (res?.ok && data.url) window.location.href = data.url;
    else setMsg(data?.error || "Couldn't open the billing portal");
  }

  return (
    <section className="card max-w-lg space-y-3">
      <h2 className="text-base font-semibold">Billing</h2>
      <p className="text-sm text-muted">
        Update your card, download invoices, or cancel — all handled securely by Stripe.
      </p>
      <button onClick={openPortal} disabled={busy} className="btn-ghost text-sm">
        {busy ? "Opening…" : "Manage subscription"}
      </button>
      {msg && <p className="text-xs text-muted">{msg}</p>}
    </section>
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
