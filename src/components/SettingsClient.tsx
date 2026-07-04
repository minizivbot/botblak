"use client";

import { useEffect, useState } from "react";

type Broker = { id: string; label: string; configured: boolean };

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
