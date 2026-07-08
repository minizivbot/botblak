"use client";

import { useCallback, useEffect, useState } from "react";

type Thread = {
  userId: string;
  username: string;
  email: string | null;
  messageCount: number;
  unread: number;
  lastBody: string;
  lastFromAdmin: boolean;
  lastAt: string | null;
};

type Msg = { id: string; fromAdmin: boolean; body: string; createdAt: string };

/** Admin inbox: every user's support thread, with inline replies. */
export function AdminSupport() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadThreads = useCallback(async () => {
    const res = await fetch("/api/admin/support").catch(() => null);
    if (!res?.ok) return;
    const data = await res.json();
    setThreads(data.threads ?? []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadThreads();
    const t = setInterval(loadThreads, 60_000);
    return () => clearInterval(t);
  }, [loadThreads]);

  async function openThread(userId: string) {
    if (openId === userId) {
      setOpenId(null);
      return;
    }
    setOpenId(userId);
    setMessages([]);
    const res = await fetch(`/api/admin/support/${userId}`).catch(() => null);
    if (!res?.ok) return;
    const data = await res.json();
    setMessages(data.messages ?? []);
    setThreads((ts) => ts.map((t) => (t.userId === userId ? { ...t, unread: 0 } : t)));
  }

  async function reply() {
    const body = draft.trim();
    if (!body || !openId || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/support/${openId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Reply failed");
        return;
      }
      setDraft("");
      setMessages((m) => [...m, data.message]);
      loadThreads();
    } finally {
      setBusy(false);
    }
  }

  const totalUnread = threads.reduce((s, t) => s + t.unread, 0);

  return (
    <section className="card space-y-3 p-0">
      <div className="flex items-center justify-between border-b border-edge px-4 py-3">
        <h2 className="text-base font-semibold">
          Support inbox 💬
          {totalUnread > 0 && (
            <span className="ml-2 rounded-full bg-loss/15 px-2 py-0.5 text-xs font-bold text-loss">{totalUnread} new</span>
          )}
        </h2>
        <button onClick={loadThreads} className="text-xs text-muted hover:text-ink-2">
          Refresh
        </button>
      </div>

      {loaded && threads.length === 0 && (
        <p className="px-4 pb-4 text-sm text-muted">No support messages yet. Users write in via the chat bubble.</p>
      )}

      <div className="divide-y divide-edge/50">
        {threads.map((t) => (
          <div key={t.userId}>
            <button
              onClick={() => openThread(t.userId)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-raised/40"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-raised text-sm font-bold text-ink-2">
                {t.username[0]?.toUpperCase() ?? "?"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-medium text-ink">
                  {t.username}
                  {t.unread > 0 && (
                    <span className="rounded-full bg-loss px-1.5 py-0.5 text-[10px] font-bold text-white">{t.unread}</span>
                  )}
                </span>
                <span className="block truncate text-xs text-muted">
                  {t.lastFromAdmin ? "You: " : ""}
                  {t.lastBody}
                </span>
              </span>
              <span className="shrink-0 text-[11px] text-muted">{t.lastAt ? t.lastAt.slice(0, 10) : ""}</span>
            </button>

            {openId === t.userId && (
              <div className="space-y-2 border-t border-edge/50 bg-raised/20 px-4 py-3">
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.fromAdmin ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-sm whitespace-pre-wrap ${
                          m.fromAdmin ? "rounded-br-sm bg-accent/90 text-white" : "rounded-bl-sm border border-edge bg-surface text-ink"
                        }`}
                      >
                        {m.body}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        reply();
                      }
                    }}
                    rows={1}
                    placeholder={`Reply to ${t.username}…`}
                    className="max-h-24 min-h-9 flex-1 resize-none rounded-xl border border-edge bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
                  />
                  <button onClick={reply} disabled={busy || !draft.trim()} className="btn-primary px-3 py-2 text-sm disabled:opacity-40">
                    Reply
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
