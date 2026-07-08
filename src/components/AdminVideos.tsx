"use client";

import { useCallback, useEffect, useState } from "react";

type Video = {
  id: string;
  title: string;
  youtubeId: string;
  category: string;
  minutes: number | null;
  sortOrder: number;
  enabled: boolean;
};

/** Accepts a full YouTube URL (watch/shorts/youtu.be/embed) or a bare video ID. */
function parseYoutubeId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{6,20}$/.test(s) && !s.includes(".")) return s;
  try {
    const url = new URL(s);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1).split("/")[0] || null;
    if (url.hostname.includes("youtube.com")) {
      if (url.searchParams.get("v")) return url.searchParams.get("v");
      const m = url.pathname.match(/\/(?:shorts|embed|live)\/([\w-]+)/);
      return m?.[1] ?? null;
    }
  } catch {
    /* not a URL */
  }
  return null;
}

/** Admin: manage the Pro video-lesson library (embedded YouTube). */
export function AdminVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [minutes, setMinutes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/videos").catch(() => null);
    if (!res?.ok) return;
    const data = await res.json();
    setVideos(data.videos ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    const youtubeId = parseYoutubeId(url);
    if (!youtubeId) {
      setMsg("Paste a YouTube link (watch, shorts or youtu.be) — couldn't find a video ID in that.");
      return;
    }
    if (!title.trim()) {
      setMsg("Give the lesson a title.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        youtubeId,
        category: category.trim() || "General",
        minutes: minutes ? Number(minutes) : null,
      }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      setUrl("");
      setTitle("");
      setMinutes("");
      setMsg("Added — live for Pro users on the Playbooks page.");
      load();
    } else {
      const b = await res?.json().catch(() => ({}));
      setMsg(b?.error || "Add failed");
    }
  }

  async function toggle(v: Video) {
    await fetch(`/api/admin/videos/${v.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !v.enabled }),
    }).catch(() => null);
    load();
  }

  async function remove(v: Video) {
    if (!confirm(`Delete "${v.title}"?`)) return;
    await fetch(`/api/admin/videos/${v.id}`, { method: "DELETE" }).catch(() => null);
    load();
  }

  return (
    <section className="card max-w-2xl space-y-4">
      <div>
        <h2 className="text-base font-semibold">Video lessons (Pro) 🎬</h2>
        <p className="text-sm text-muted">
          Paste a YouTube link and it appears in the Pro lesson library on the Playbooks page — embedded via the
          official player, so the creator keeps the views.
        </p>
      </div>

      <div className="space-y-2">
        <input className="field" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="YouTube link — https://www.youtube.com/watch?v=…" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <input className="field col-span-2" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Title, e.g. Silver Bullet full lesson" />
          <input className="field" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={40} placeholder="Category (FVG…)" list="video-categories" />
          <input className="field" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="Minutes" inputMode="numeric" />
          <datalist id="video-categories">
            {[...new Set(videos.map((v) => v.category))].map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary text-sm" onClick={add} disabled={busy}>
            {busy ? "Adding…" : "Add lesson"}
          </button>
          {msg && <span className="text-xs text-muted">{msg}</span>}
        </div>
      </div>

      {videos.length > 0 && (
        <div className="divide-y divide-edge/50 rounded-xl border border-edge">
          {videos.map((v) => (
            <div key={v.id} className="flex items-center gap-3 px-3 py-2">
              <img
                src={`https://i.ytimg.com/vi/${v.youtubeId}/default.jpg`}
                alt=""
                className="h-9 w-12 shrink-0 rounded object-cover"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${v.enabled ? "text-ink" : "text-muted line-through"}`}>{v.title}</p>
                <p className="text-xs text-muted">
                  {v.category}
                  {v.minutes ? ` · ${v.minutes} min` : ""}
                </p>
              </div>
              <button onClick={() => toggle(v)} className="text-xs text-muted hover:text-ink-2">
                {v.enabled ? "Hide" : "Show"}
              </button>
              <button onClick={() => remove(v)} className="text-xs text-loss hover:underline">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
