"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Pricing CTA. Tries real Stripe Checkout first; when billing isn't configured
 * yet (503), falls back to an upgrade request in the support chat that the
 * admin fulfils manually.
 */
export function UpgradeButton({
  plan,
  authed,
  isPro,
  highlight = false,
}: {
  plan: "monthly" | "yearly";
  authed: boolean;
  isPro: boolean;
  highlight?: boolean;
}) {
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");

  const cls = highlight
    ? "btn-primary block w-full text-center"
    : "block w-full rounded-xl border border-edge bg-raised/60 px-4 py-2.5 text-center text-sm font-semibold text-ink transition-colors hover:border-accent/60";

  if (isPro) {
    return <div className={`${cls} pointer-events-none opacity-60`}>You&apos;re on Pro ✓</div>;
  }
  if (!authed) {
    return (
      <Link href="/register" className={cls}>
        Create account to upgrade
      </Link>
    );
  }
  if (state === "sent") {
    return (
      <div className="rounded-xl border border-profit/40 bg-profit/10 px-4 py-2.5 text-center text-sm font-medium text-profit">
        Request sent — we&apos;ll activate Pro and message you shortly 🎉
      </div>
    );
  }

  async function upgrade() {
    setState("busy");

    // 1. Real checkout when Stripe is wired up.
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    }).catch(() => null);
    if (res?.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    }

    // 2. Fallback: file the upgrade as a support request.
    if (res?.status === 503) {
      const label = plan === "yearly" ? "yearly ($120/yr)" : "monthly ($5 first month, then $15/mo)";
      const support = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: `🚀 Upgrade request: I'd like the ${label} Pro plan.` }),
      }).catch(() => null);
      setState(support?.ok ? "sent" : "error");
      return;
    }

    setState("error");
  }

  return (
    <div>
      <button onClick={upgrade} disabled={state === "busy"} className={`${cls} disabled:opacity-50`}>
        {state === "busy" ? "One sec…" : plan === "yearly" ? "Get yearly Pro" : "Get monthly Pro"}
      </button>
      {state === "error" && <p className="mt-1.5 text-center text-xs text-loss">Something went wrong — try again.</p>}
    </div>
  );
}
