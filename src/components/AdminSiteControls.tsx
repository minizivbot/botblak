"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Config = {
  announcement: string | null;
  announcementLevel: string;
  registrationOpen: boolean;
  propFirmsEnabled: boolean;
  proForAll: boolean;
};

/** Admin controls that change the whole site for every visitor. */
export function AdminSiteControls({ initial }: { initial: Config }) {
  const router = useRouter();
  const [announcement, setAnnouncement] = useState(initial.announcement ?? "");
  const [level, setLevel] = useState(initial.announcementLevel);
  const [registrationOpen, setRegistrationOpen] = useState(initial.registrationOpen);
  const [propFirmsEnabled, setPropFirmsEnabled] = useState(initial.propFirmsEnabled);
  const [proForAll, setProForAll] = useState(initial.proForAll);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/site", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        announcement: announcement.trim() || null,
        announcementLevel: level,
        registrationOpen,
        propFirmsEnabled,
        proForAll,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("Saved — changes are live across the site.");
      router.refresh();
    } else {
      const b = await res.json().catch(() => ({}));
      setMsg(b.error || "Save failed");
    }
  }

  return (
    <section className="card max-w-2xl space-y-4">
      <div>
        <h2 className="text-base font-semibold">Site controls</h2>
        <p className="text-sm text-muted">These apply to every visitor immediately.</p>
      </div>

      <div>
        <label className="field-label">Announcement banner</label>
        <input
          className="field"
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          maxLength={280}
          placeholder="e.g. 🎉 New: prop-firm tracker is live! (leave empty to hide)"
        />
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-muted">Style:</span>
          {["info", "success", "warning"].map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
                level === l ? "border-accent/60 bg-accent/15 text-ink" : "border-edge text-muted hover:text-ink-2"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-start gap-2.5 rounded-lg border border-edge bg-raised/40 px-3 py-2.5">
        <input type="checkbox" checked={registrationOpen} onChange={(e) => setRegistrationOpen(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#3987e5]" />
        <span className="text-sm">
          <span className="font-medium text-ink">Registration open</span>
          <span className="block text-xs text-muted">Uncheck to stop new sign-ups (existing users unaffected).</span>
        </span>
      </label>

      <label className="flex items-start gap-2.5 rounded-lg border border-edge bg-raised/40 px-3 py-2.5">
        <input type="checkbox" checked={propFirmsEnabled} onChange={(e) => setPropFirmsEnabled(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#3987e5]" />
        <span className="text-sm">
          <span className="font-medium text-ink">Prop Firms page enabled</span>
          <span className="block text-xs text-muted">Uncheck to hide the Prop Firms page and its menu item from everyone.</span>
        </span>
      </label>

      <label className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${proForAll ? "border-yellow-500/50 bg-yellow-500/10" : "border-edge bg-raised/40"}`}>
        <input type="checkbox" checked={proForAll} onChange={(e) => setProForAll(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#eab308]" />
        <span className="text-sm">
          <span className="font-medium text-ink">
            PRO free for everyone {proForAll && <span className="ml-1 rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-500">ACTIVE</span>}
          </span>
          <span className="block text-xs text-muted">
            While on, every Pro feature (Prop Desk, AI coach, broker sync, unlimited accounts, themes…) is unlocked
            for all users — great for launches and promos. Turn off to restore normal Pro gating.
          </span>
        </span>
      </label>

      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save site settings"}
        </button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </section>
  );
}
