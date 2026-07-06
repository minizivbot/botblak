"use client";

import { useState } from "react";

/**
 * Opens a modal previewing a branded share image (generated server-side) with
 * download + copy actions, so users can post their wins to Twitter/Discord.
 */
export function ShareButton({
  href,
  filename,
  label = "Share",
  className = "btn-ghost",
}: {
  href: string;
  filename: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // Cache-bust so the image reflects the latest data each open.
  const src = open ? `${href}${href.includes("?") ? "&" : "?"}t=${Date.now()}` : "";

  async function copyImage() {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard image write isn't supported everywhere — download still works.
    }
  }

  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="card w-full max-w-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Share your card</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-muted hover:text-ink">✕</button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="Share card" className="w-full rounded-lg border border-edge" />
            <p className="mt-2 text-xs text-muted">Post it on X/Twitter or Discord — it links back to TradeZone.</p>
            <div className="mt-3 flex gap-2">
              <a href={src} download={filename} className="btn-primary text-sm">Download</a>
              <button className="btn-ghost text-sm" onClick={copyImage}>{copied ? "Copied!" : "Copy image"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
