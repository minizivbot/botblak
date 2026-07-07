"use client";

import { useEffect } from "react";

/** Registers the push-notification service worker once per session. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => null);
    }
  }, []);
  return null;
}
