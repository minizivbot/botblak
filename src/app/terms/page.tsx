import Link from "next/link";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 py-4">
      <Link href="/" className="text-sm text-muted hover:text-ink">← Back</Link>
      <h1 className="text-2xl font-semibold">Terms of Service</h1>
      <p className="text-sm text-muted">Last updated: {new Date().toISOString().slice(0, 10)}</p>

      <div className="space-y-4 text-sm text-ink-2">
        <section>
          <h2 className="text-base font-semibold text-ink">What TradeZone is</h2>
          <p>
            TradeZone is a personal trading journal and analytics tool. It helps you log and review your own trades.
            It is <span className="text-ink">not</span> financial, investment, or trading advice, and nothing in it is a
            recommendation to buy or sell anything.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">No warranty</h2>
          <p>
            The service is provided &quot;as is&quot; without warranties of any kind. Stats, imports, and broker syncs
            can contain errors — always verify against your broker&apos;s own statements before relying on any number.
            The leaderboard shows self-reported data unless marked verified.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">Your responsibilities</h2>
          <p>
            Keep your login secure, only connect broker accounts you own, and don&apos;t abuse the service or attempt to
            access other users&apos; data. You are responsible for your own trading decisions and outcomes.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, the operators of TradeZone are not liable for any trading losses,
            data loss, or damages arising from use of the service.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">Changes</h2>
          <p>These terms may change over time. Continued use means you accept the current version.</p>
        </section>
      </div>
    </div>
  );
}
