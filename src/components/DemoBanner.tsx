import Link from "next/link";

/**
 * Shown to logged-out visitors browsing the live demo. Explains what they're
 * looking at and points to sign-up.
 */
export function DemoBanner() {
  return (
    <div className="card flex flex-wrap items-center justify-between gap-3 !border-accent/40 bg-gradient-to-r from-accent/10 to-profit/5">
      <div>
        <p className="text-sm font-semibold text-ink">
          👋 This is a live demo — real sample data, every feature working.
        </p>
        <p className="text-sm text-ink-2">
          Create a free account to log your own trades, sync your broker, and get insights on your edge.
        </p>
      </div>
      <div className="flex gap-2">
        <Link href="/register" className="btn-primary text-sm">
          Create free account
        </Link>
        <Link href="/login" className="btn-ghost text-sm">
          Sign in
        </Link>
      </div>
    </div>
  );
}
