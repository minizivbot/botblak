import Link from "next/link";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 py-4">
      <Link href="/" className="text-sm text-muted hover:text-ink">← Back</Link>
      <h1 className="text-2xl font-semibold">Privacy Policy</h1>
      <p className="text-sm text-muted">Last updated: {new Date().toISOString().slice(0, 10)}</p>

      <div className="prose-tz space-y-4 text-sm text-ink-2">
        <section>
          <h2 className="text-base font-semibold text-ink">What we store</h2>
          <p>
            TradeZone is a trading journal. When you use it we store the account you create (a username, and a
            securely hashed password — we never store your password in plain text), the trades and journal entries you
            add, your settings, and — if you choose to connect a broker — your broker credentials, encrypted at rest.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">Broker credentials</h2>
          <p>
            Broker API keys and passwords you enter on the Import &amp; Sync page are encrypted (AES-256-GCM) before
            being saved and are only decrypted server-side to fetch your trades. They are never shown back to the
            browser. You can disconnect a broker at any time, which deletes the stored credentials.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">What&apos;s public</h2>
          <p>
            Your public profile page shows your username and aggregate stats (net P&L, win rate, trade count) to
            anyone with the link. You can make your profile private at any time in{" "}
            <Link href="/settings" className="text-accent hover:underline">Settings</Link>. Your individual trades,
            journal, and broker connections are never public.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">Sign-in with Google</h2>
          <p>
            If you sign in with Google we receive your Google account&apos;s email and basic profile to create or match
            your account. We do not access your Gmail or any other Google data.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">Your choices</h2>
          <p>
            You can edit or delete your trades and accounts at any time, make your profile private, and
            disconnect brokers. To delete your account entirely, contact the site owner.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-ink">Contact</h2>
          <p>Questions about your data? Reach out to the site owner.</p>
        </section>
      </div>
    </div>
  );
}
