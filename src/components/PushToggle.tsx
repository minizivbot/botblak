"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64: string): BufferSource {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

type Status = "unsupported" | "loading" | "off" | "on" | "denied";

/** Enable/disable browser push notifications (risk-guard alerts, funded status, announcements). */
export function PushToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "on" : "off");
    });
  }, []);

  async function enable() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setStatus("unsupported");
      return;
    }
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setStatus("on");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`, { method: "DELETE" }).catch(() => null);
        await sub.unsubscribe();
      }
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") return null;
  if (status === "unsupported") {
    return <p className="text-xs text-muted">Push notifications aren&apos;t supported in this browser.</p>;
  }

  return (
    <label className="flex items-start gap-2.5 rounded-lg border border-edge bg-raised/40 px-3 py-2.5">
      <input
        type="checkbox"
        checked={status === "on"}
        disabled={busy || status === "denied"}
        onChange={(e) => (e.target.checked ? enable() : disable())}
        className="mt-0.5 h-4 w-4 accent-[#3987e5]"
      />
      <span className="text-sm">
        <span className="font-medium text-ink">Push notifications</span>
        <span className="block text-xs text-muted">
          {status === "denied"
            ? "Blocked in your browser settings — enable notifications for this site to use it."
            : "Get alerted when you're near your daily loss limit, when a prop challenge passes, or on site announcements."}
        </span>
      </span>
    </label>
  );
}
