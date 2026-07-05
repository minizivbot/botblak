"use client";

import { useEffect, useState } from "react";

type Firm = {
  id: string;
  name: string;
  blurb: string;
  highlight: string | null;
  affiliateUrl: string;
  emoji: string;
  sortOrder: number;
  enabled: boolean;
};

function FirmEditor({ firm, onChanged }: { firm: Firm; onChanged: () => void }) {
  const [url, setUrl] = useState(firm.affiliateUrl);
  const [highlight, setHighlight] = useState(firm.highlight ?? "");
  const [enabled, setEnabled] = useState(firm.enabled);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await fetch(`/api/admin/prop-firms/${firm.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ affiliateUrl: url.trim(), highlight: highlight.trim() || null, enabled }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("Saved");
      onChanged();
    } else {
      const b = await res.json().catch(() => ({}));
      setMsg(b.error || "Save failed");
    }
  }

  async function remove() {
    if (!confirm(`Remove ${firm.name} from the list?`)) return;
    await fetch(`/api/admin/prop-firms/${firm.id}`, { method: "DELETE" }).catch(() => null);
    onChanged();
  }

  return (
    <div className="rounded-lg border border-edge bg-raised/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{firm.emoji} {firm.name}</p>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-muted">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-3.5 w-3.5 accent-[#3987e5]" />
            Show
          </label>
          <button onClick={remove} className="text-xs text-loss hover:underline">Remove</button>
        </div>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div>
          <label className="field-label">Your affiliate link</label>
          <input className="field" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://apextraderfunding.com/…/YOURCODE" />
        </div>
        <div>
          <label className="field-label">Highlight / promo (optional)</label>
          <input className="field" value={highlight} onChange={(e) => setHighlight(e.target.value)} placeholder="90% off with code ZIV" maxLength={80} />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <button className="btn-primary text-sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        {msg && <span className="text-xs text-muted">{msg}</span>}
      </div>
    </div>
  );
}

/** Admin editor for the prop-firm affiliate list. */
export function AdminPropFirms() {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏦");
  const [blurb, setBlurb] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => fetch("/api/admin/prop-firms").then((r) => r.json()).then((b) => setFirms(b.firms ?? [])).catch(() => null);
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/admin/prop-firms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, emoji, blurb }),
    }).catch(() => null);
    setName(""); setEmoji("🏦"); setBlurb("");
    setBusy(false);
    load();
  }

  return (
    <section className="card max-w-2xl space-y-3">
      <div>
        <h2 className="text-base font-semibold">Prop firm affiliate links</h2>
        <p className="text-sm text-muted">
          Paste your referral link for each firm. They show on the public{" "}
          <a href="/prop-firms" className="text-accent hover:underline">Prop firms</a> page.
        </p>
      </div>

      {firms.map((f) => <FirmEditor key={f.id} firm={f} onChanged={load} />)}

      <form onSubmit={add} className="flex flex-wrap items-end gap-2 border-t border-edge pt-3">
        <div className="w-16">
          <label className="field-label">Emoji</label>
          <input className="field text-center" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} />
        </div>
        <div className="min-w-40 flex-1">
          <label className="field-label">Add a firm</label>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Firm name" maxLength={60} />
        </div>
        <button className="btn-primary" type="submit" disabled={busy || !name.trim()}>Add</button>
      </form>
    </section>
  );
}
