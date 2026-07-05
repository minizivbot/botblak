import Link from "next/link";

const STEPS = [
  {
    emoji: "📝",
    title: "Log your first trade",
    body: "Add a trade by hand — the time is stamped for you, and futures P&L is priced per contract (MES $5/pt, ES $50/pt…).",
    href: "/trades",
    cta: "Add a trade",
  },
  {
    emoji: "📥",
    title: "Or import your history",
    body: "Bring in a CSV from MetaTrader or Tradovate, or connect a broker to sync fills automatically.",
    href: "/import",
    cta: "Import & sync",
  },
  {
    emoji: "🏦",
    title: "Set up your accounts",
    body: "Track prop challenges with profit targets and trailing drawdown, or mark copy-trading accounts.",
    href: "/accounts",
    cta: "Manage accounts",
  },
];

/** Shown on the dashboard to a signed-in user who hasn't logged any trades yet. */
export function Onboarding({ username }: { username: string | null }) {
  return (
    <div className="space-y-4">
      <div className="card bg-gradient-to-br from-accent/10 to-profit/5">
        <h1 className="text-2xl font-bold">Welcome{username ? `, ${username}` : ""}! 👋</h1>
        <p className="mt-1 text-ink-2">
          Your dashboard fills up as you log trades. Here&apos;s how to get your first ones in:
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.title} className="card flex flex-col">
            <div className="text-3xl">{s.emoji}</div>
            <h2 className="mt-2 font-semibold">{s.title}</h2>
            <p className="mt-1 flex-1 text-sm text-ink-2">{s.body}</p>
            <Link href={s.href} className="btn-primary mt-3 text-center text-sm">{s.cta}</Link>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-muted">
        Want to see what it looks like full? Everything on the{" "}
        <Link href="/learn" className="text-accent hover:underline">Learn</Link> page explains the stats, killzones, and
        ICT concepts.
      </p>
    </div>
  );
}
