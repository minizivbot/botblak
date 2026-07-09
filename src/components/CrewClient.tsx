"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Create-or-join UI shown when the user isn't in a crew yet. */
export function CrewSetup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(url: string, body: Record<string, string>) {
    setBusy(true);
    setError(null);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy(false);
    if (res?.ok) router.refresh();
    else setError(data?.error || "Something went wrong");
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="card space-y-3">
        <h2 className="text-base font-semibold">Start a crew 🚀</h2>
        <p className="text-sm text-muted">Name it, get an invite code, send it to the boys.</p>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder="Crew name — e.g. Funded Gang" />
        <button className="btn-primary w-full text-sm" onClick={() => call("/api/crew", { name })} disabled={busy || name.trim().length < 2}>
          {busy ? "…" : "Create crew"}
        </button>
      </div>

      <div className="card space-y-3">
        <h2 className="text-base font-semibold">Join a crew 🎟️</h2>
        <p className="text-sm text-muted">Got a code from a friend? Punch it in.</p>
        <input
          className="field font-mono tracking-widest uppercase"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={12}
          placeholder="INVITE CODE"
        />
        <button className="btn-primary w-full text-sm" onClick={() => call("/api/crew/join", { code })} disabled={busy || code.trim().length < 4}>
          {busy ? "…" : "Join crew"}
        </button>
      </div>

      {error && <p className="rounded-lg border border-loss/40 bg-loss/10 px-3 py-2 text-sm text-loss sm:col-span-2">{error}</p>}
    </div>
  );
}

/** Invite-code chip with copy, plus the leave button. */
export function CrewActions({ code }: { code: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function leave() {
    if (!confirm("Leave this crew?")) return;
    setBusy(true);
    await fetch("/api/crew/leave", { method: "POST" }).catch(() => null);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={copy}
        className="flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-accent hover:bg-accent/20"
        title="Copy invite code"
      >
        {code}
        <span className="text-xs font-sans font-normal">{copied ? "Copied ✓" : "Copy"}</span>
      </button>
      <button onClick={leave} disabled={busy} className="text-xs text-muted hover:text-loss">
        Leave crew
      </button>
    </div>
  );
}
