import { getViewer } from "@/lib/viewer";
import { PRICING } from "@/lib/plan";
import { aiConfigured } from "@/lib/ai";
import { UpgradeButton } from "@/components/UpgradeButton";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Pricing",
  description: "TradeZone Pro — unlimited accounts, broker auto-sync, and advanced performance reports.",
};

const FREE_FEATURES = [
  "Unlimited trades",
  "2 trading accounts",
  "Dashboard stats, killzones & insights",
  "P&L calendar with red-folder news days",
  "Crew — private group with your friends",
  "Morning red-folder push + weekly recap push",
  "6 ICT playbooks + video lessons (Learn)",
  "Achievements & green-day streaks",
  "Prop-firm challenge tracker & risk guard",
  "CSV import & export, shareable stat cards",
];

const PRO_FEATURES_BASE = [
  "Everything in Free",
  "Unlimited trading accounts",
  "Broker auto-sync (Tradovate, Alpaca)",
  "Custom app themes — gold, violet, emerald & more",
  "Priority support — your requests jump the queue",
];

/** The AI coach is only advertised once it's actually live (API key set). */
function proFeatures(coachLive: boolean): string[] {
  return coachLive
    ? [
        PRO_FEATURES_BASE[0],
        "🧠 AI Coach — Claude reads your last 30 days and tells you exactly what to fix (3 sessions/day)",
        ...PRO_FEATURES_BASE.slice(1),
      ]
    : PRO_FEATURES_BASE;
}

function Check({ dim = false }: { dim?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={`mt-0.5 h-4 w-4 shrink-0 ${dim ? "text-muted" : "text-profit"}`}>
      <path d="M4 10.5l4 4L16 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function PricingPage() {
  const viewer = await getViewer();
  const authed = !viewer.isDemo;
  const PRO_FEATURES = proFeatures(aiConfigured());

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">
          Trade smarter with <span className="text-accent">TradeZone Pro</span>
        </h1>
        <p className="text-sm text-ink-2">
          The journal is free forever. Pro unlocks the heavy tools for traders who are serious about the data.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Free */}
        <div className="card flex flex-col space-y-4">
          <div>
            <p className="text-sm font-semibold text-ink">Free</p>
            <p className="mt-1 text-3xl font-bold">
              $0<span className="text-sm font-normal text-muted"> / forever</span>
            </p>
          </div>
          <ul className="flex-1 space-y-2 text-sm text-ink-2">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex gap-2">
                <Check dim />
                {f}
              </li>
            ))}
          </ul>
          <div className="pointer-events-none rounded-xl border border-edge px-4 py-2.5 text-center text-sm font-medium text-muted">
            {authed ? "Your current plan" : "What you start with"}
          </div>
        </div>

        {/* Monthly */}
        <div className="card flex flex-col space-y-4">
          <div>
            <p className="text-sm font-semibold text-ink">Pro — Monthly</p>
            <p className="mt-1 text-3xl font-bold">
              ${PRICING.monthlyFirst}
              <span className="text-sm font-normal text-muted"> first month</span>
            </p>
            <p className="text-xs text-muted">then ${PRICING.monthly}/month · cancel anytime</p>
          </div>
          <ul className="flex-1 space-y-2 text-sm text-ink-2">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex gap-2">
                <Check />
                {f}
              </li>
            ))}
          </ul>
          <UpgradeButton plan="monthly" authed={authed} isPro={viewer.isPro} />
        </div>

        {/* Yearly */}
        <div className="card relative flex flex-col space-y-4 border-amber-400/40 ring-1 ring-amber-400/30">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-3 py-0.5 text-[11px] font-bold text-black">
            SAVE {PRICING.yearlySavePct}%
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Pro — Yearly</p>
            <p className="mt-1 text-3xl font-bold">
              ${PRICING.yearly}
              <span className="text-sm font-normal text-muted"> / year</span>
            </p>
            <p className="text-xs text-muted">
              = $10/month · <s className="text-muted/70">${PRICING.monthlyFirstYear} on monthly</s>
            </p>
          </div>
          <ul className="flex-1 space-y-2 text-sm text-ink-2">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex gap-2">
                <Check />
                {f}
              </li>
            ))}
          </ul>
          <UpgradeButton plan="yearly" authed={authed} isPro={viewer.isPro} highlight />
        </div>
      </div>

      <p className="text-center text-xs text-muted">
        Payments are handled by Stripe — cancel anytime from Settings. If card checkout isn&apos;t live yet, the button
        files an upgrade request instead and we activate you personally within a few hours. Questions? Use the support
        chat in the corner. 💬
      </p>
    </div>
  );
}
