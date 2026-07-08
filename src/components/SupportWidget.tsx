"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Msg = { id: string; fromAdmin: boolean; body: string; createdAt: string };

/**
 * Floating support chat bubble (bottom-right, every page). Users write to the
 * site team; only admins can reply, from the admin panel's Support inbox.
 */
export function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [unread, setUnread] = useState(0);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const loadThread = useCallback(async () => {
    const res = await fetch("/api/support").catch(() => null);
    if (!res?.ok) return;
    const data = await res.json();
    setMessages(data.messages ?? []);
    setUnread(0);
  }, []);

  // Badge poll: cheap peek that doesn't mark replies as seen.
  useEffect(() => {
    let alive = true;
    async function peek() {
      const res = await fetch("/api/support?peek=1").catch(() => null);
      if (!res?.ok || !alive) return;
      const data = await res.json();
      setUnread(data.unread ?? 0);
    }
    peek();
    const t = setInterval(peek, 90_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  // Load the thread when opened, and refresh it periodically while open.
  useEffect(() => {
    if (!open) return;
    loadThread();
    const t = setInterval(loadThread, 30_000);
    return () => clearInterval(t);
  }, [open, loadThread]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to send");
        return;
      }
      setDraft("");
      setMessages((m) => [...m, data.message]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed right-4 bottom-20 z-50 flex max-h-[70vh] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-edge bg-surface shadow-2xl shadow-black/40 print:hidden">
          <div className="flex items-center justify-between border-b border-edge bg-raised/60 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">Support 💬</p>
              <p className="text-[11px] text-muted">We usually reply within a few hours</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close support" className="rounded-lg px-2 py-1 text-muted hover:bg-raised hover:text-ink">
              ✕
            </button>
          </div>

          <div ref={listRef} className="min-h-40 flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {messages.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-muted">
                Questions, bugs, upgrade requests — write to us and we&apos;ll answer right here. 👋
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.fromAdmin ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.fromAdmin
                      ? "rounded-bl-sm border border-edge bg-raised text-ink"
                      : "rounded-br-sm bg-accent/90 text-white"
                  }`}
                >
                  {m.fromAdmin && <p className="mb-0.5 text-[10px] font-bold text-accent">TradeZone team</p>}
                  {m.body}
                </div>
              </div>
            ))}
          </div>

          {error && <p className="px-4 pb-1 text-xs text-loss">{error}</p>}
          <div className="flex items-end gap-2 border-t border-edge p-2.5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Write a message…"
              className="max-h-24 min-h-9 flex-1 resize-none rounded-xl border border-edge bg-raised/60 px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <button
              onClick={send}
              disabled={sending || !draft.trim()}
              aria-label="Send"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white transition-opacity disabled:opacity-40"
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                <path d="M3 10l14-6-4.5 14L9 12.5 3 10z" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Support chat"
        className="fixed right-4 bottom-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent to-profit-mark text-white shadow-lg shadow-black/40 transition-transform hover:scale-105 print:hidden"
      >
        {open ? (
          <span className="text-lg leading-none">✕</span>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-6 w-6">
            <path d="M21 12a8 8 0 01-8 8c-1.2 0-2.4-.25-3.4-.72L4 21l1.8-4.5A8 8 0 1121 12z" strokeLinejoin="round" />
            <path d="M8.5 10.5h7M8.5 13.5h4.5" strokeLinecap="round" />
          </svg>
        )}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-loss px-1 text-[11px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}
