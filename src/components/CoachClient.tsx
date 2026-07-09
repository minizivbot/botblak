"use client";

import { useState } from "react";

type Report = { id: string; body: string; createdAt: string };

function ReportCard({ body, createdAt, latest = false }: { body: string; createdAt: string; latest?: boolean }) {
  return (
    <article className={`card space-y-2 ${latest ? "border-accent/40" : ""}`}>
      <p className="text-xs text-muted">
        {latest && <span className="mr-2 rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">LATEST</span>}
        {new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>
      <div className="text-[15px] leading-relaxed whitespace-pre-wrap text-ink-2">{body}</div>
    </article>
  );
}

export function CoachClient({ initialReports, configured }: { initialReports: Report[]; configured: boolean }) {
  const [reports, setReports] = useState(initialReports);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/coach", { method: "POST" }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy(false);
    if (res?.ok) {
      setReports((r) => [{ id: `new-${Date.now()}`, body: data.body, createdAt: new Date().toISOString() }, ...r]);
    } else {
      setError(data?.error || "Something went wrong — try again");
    }
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 border-accent/30">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Ready for your review?</p>
          <p className="text-xs text-muted">
            The coach reads your last 30 days — every killzone, every streak, every leak — and tells you the one thing
            to fix this week. Up to 3 sessions a day.
          </p>
        </div>
        <button className="btn-primary text-sm" onClick={run} disabled={busy || !configured}>
          {busy ? "Reviewing your trades…" : "🧠 Coach me"}
        </button>
      </div>

      {!configured && (
        <p className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-300">
          The coach is being hooked up — it&apos;ll go live here very soon.
        </p>
      )}
      {error && <p className="rounded-lg border border-loss/40 bg-loss/10 px-3 py-2 text-sm text-loss">{error}</p>}
      {busy && (
        <div className="card animate-pulse space-y-2">
          <div className="h-3 w-1/3 rounded bg-raised" />
          <div className="h-3 w-full rounded bg-raised" />
          <div className="h-3 w-5/6 rounded bg-raised" />
          <div className="h-3 w-2/3 rounded bg-raised" />
        </div>
      )}

      {reports.map((r, i) => (
        <ReportCard key={r.id} body={r.body} createdAt={r.createdAt} latest={i === 0} />
      ))}

      {reports.length === 0 && !busy && configured && (
        <p className="pt-4 text-center text-sm text-muted">No reviews yet — hit the button and get coached. 🥊</p>
      )}
    </div>
  );
}
