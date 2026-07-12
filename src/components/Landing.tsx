import Link from "next/link";

const FEATURES = [
  {
    emoji: "🌅",
    title: "The Today cockpit",
    body: "Open the app into your trading day — pre-market plan, live killzone clock, trades vs. your own max, and a stop-trading guard on your loss limit.",
  },
  {
    emoji: "📘",
    title: "Playbooks with proof",
    body: "Turn every setup into a rule checklist. Tick what you followed on each trade — and see in dollars what the full checklist pays vs. the rushed entry.",
  },
  {
    emoji: "🎯",
    title: "Edge Score",
    body: "One honest 0–100 number for your whole operation — payoff, consistency, discipline and risk — with your strongest and weakest link named.",
  },
  {
    emoji: "🏦",
    title: "Prop Desk",
    body: "The business ledger nobody else has: challenge fees, resets and payouts netted per firm, with ROI and your funded pass rate.",
  },
  {
    emoji: "🅰️",
    title: "Discipline grades",
    body: "Every session graded A–F automatically — overtrading, revenge entries, off-killzone trades and loss-limit breaches all cost points.",
  },
  {
    emoji: "📸",
    title: "Share cards",
    body: "Branded daily P&L images built for X and Discord — your day, your accounts, your R:R, one tap to download.",
  },
];

/** The public landing page — what a logged-out visitor sees at the root. */
export function Landing() {
  return (
    <div className="mx-auto max-w-5xl space-y-16 py-8 sm:py-14">
      {/* Hero */}
      <section className="text-center">
        <p className="mx-auto w-fit rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent">
          Built for funded futures traders — Apex, TopStep &amp; friends
        </p>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Trade like it&apos;s a <span className="text-accent">business</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-ink-2 sm:text-lg">
          TradeZone is the journal that coaches you: plan the session, grade your discipline, prove your playbook —
          and know whether your prop challenges are actually making money.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/register" className="btn-primary !px-6 !py-3 text-base">Start free — no card</Link>
          <Link href="/review" className="btn-ghost !px-6 !py-3 text-base">Browse the live demo →</Link>
        </div>
        <p className="mt-4 text-xs text-muted">Free forever for your core journal. Pro is $15/mo — a third of the big names.</p>
      </section>

      {/* Features */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card">
            <p className="text-2xl">{f.emoji}</p>
            <h2 className="mt-2 text-base font-semibold">{f.title}</h2>
            <p className="mt-1.5 text-sm text-ink-2">{f.body}</p>
          </div>
        ))}
      </section>

      {/* Pricing */}
      <section className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
        <div className="card">
          <h2 className="text-base font-semibold">Free</h2>
          <p className="mt-1 text-3xl font-bold">$0</p>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-2">
            <li>✓ Unlimited trades &amp; full analytics</li>
            <li>✓ Playbooks, Edge Score, discipline grades</li>
            <li>✓ Daily plan, calendar, share cards</li>
            <li>✓ 2 trading accounts</li>
          </ul>
        </div>
        <div className="card !border-accent/50">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            Pro <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">$15/mo</span>
          </h2>
          <p className="mt-1 text-3xl font-bold">$15<span className="text-base font-medium text-muted">/mo</span></p>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-2">
            <li>✓ Everything in Free</li>
            <li>✓ Prop Desk — fees vs. payouts per firm</li>
            <li>✓ Unlimited accounts &amp; broker sync</li>
            <li>✓ Custom themes &amp; priority support</li>
          </ul>
          <Link href="/register" className="btn-primary mt-4 block w-full text-center text-sm">Get started</Link>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="card !border-accent/30 text-center">
        <h2 className="text-xl font-semibold">Your next payout starts with better sessions.</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-ink-2">
          Two minutes to sign up. Log today&apos;s first trade, set your loss limit, and let the journal keep you honest.
        </p>
        <Link href="/register" className="btn-primary mx-auto mt-5 !px-8 !py-3 text-base">Create your free account</Link>
      </section>
    </div>
  );
}
