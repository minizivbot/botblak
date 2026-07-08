import { prisma } from "@/lib/prisma";
import { PLAYBOOKS } from "@/lib/playbooks";
import { PlaybookCard } from "@/components/PlaybookCard";

export const metadata = { title: "Learn" };
export const dynamic = "force-dynamic";

const STATS = [
  ["Win rate", "Out of your closed trades, how many made money. 55% means 55 winners per 100 trades. High win rate alone means nothing — a trader with 90% wins and huge losers still loses money."],
  ["Profit factor", "All the money your winners made ÷ all the money your losers lost. Above 1.0 you're profitable; 1.5–2.0 is solid; above 3 is elite. The single best 'am I actually good?' number."],
  ["Expectancy", "Your average P&L per trade, wins and losses mixed together. If it's +$50, then every time you click, you 'earn' $50 on average — even the losers are part of the business."],
  ["Max drawdown", "The deepest fall from an equity peak. If your account hit $27,000 and dropped to $26,300, that's a $700 drawdown. Prop firms judge you on this more than on profits."],
  ["Reward-to-risk (R)", "Average win ÷ average loss. 2R means your typical winner is twice your typical loser — with 2R you can be wrong 60% of the time and still grow."],
  ["Equity curve", "Your account balance drawn over time, trade by trade. You want a staircase going up-right. Cliffs = rule breaks. Check the Drawdown chart under it to see the pain periods."],
] as const;

const KILLZONES = [
  ["Asia KZ", "20:00–00:00 NY time. Quiet range-building; its highs/lows become the liquidity for London."],
  ["London KZ", "02:00–05:00. First real expansion of the day; often sets the daily high or low."],
  ["NY AM KZ", "07:00–10:00. The main event — news, volume, and the setups most day traders live on."],
  ["London Close KZ", "10:00–12:00. Includes the 10–11am AM Silver Bullet window; reversals as London exits."],
  ["NY PM KZ", "13:30–16:00. Afternoon trend or reversal into the close; the 2–3pm PM Silver Bullet lives here."],
] as const;

const CONCEPTS = [
  ["FVG (Fair Value Gap)", "A 3-candle gap where price moved so fast it left an imbalance. Price often comes back to 'fill' it — a classic entry zone."],
  ["Order Block", "The last opposite candle before a strong move — where the big orders sat. Price frequently reacts on the retest."],
  ["Breaker", "An order block that failed and flipped sides. Old support becomes resistance (and vice versa) with extra force."],
  ["Liquidity Sweep", "Price spikes past an obvious high/low to trigger everyone's stops, then reverses. The move everyone got wrong — and your entry."],
  ["MSS / BOS", "Market Structure Shift / Break of Structure — the moment the sequence of highs and lows changes direction. Confirmation, not prediction."],
  ["SMT Divergence", "Two correlated markets (ES vs NQ) disagree: one makes a new low, the other refuses. The refusal side is showing its hand."],
  ["OTE", "Optimal Trade Entry — the 62–79% retracement pocket of a swing. Entry discount inside the move you already expect."],
  ["Judas Swing", "The fake move at session open, engineered to trap early traders before the real move goes the other way."],
  ["Power of 3 (AMD)", "Accumulation → Manipulation → Distribution. The session's story in three acts; trade act three, not act two."],
  ["Draw on Liquidity", "The pool of resting orders (old highs/lows, gaps) that price is being pulled toward. No draw = no trade."],
] as const;

const SIZES = [
  ["ES", "S&P 500", "$50", "1 ES → size 50"],
  ["MES", "Micro S&P", "$5", "2 MES → size 10"],
  ["NQ", "Nasdaq", "$20", "1 NQ → size 20"],
  ["MNQ", "Micro Nasdaq", "$2", "3 MNQ → size 6"],
  ["GC", "Gold", "$100", "1 GC → size 100"],
  ["MGC", "Micro Gold", "$10", "2 MGC → size 20"],
  ["CL", "Crude Oil", "$1,000 per $1", "1 CL → size 1000"],
] as const;

export default async function LearnPage() {
  const videos = await prisma.videoLesson.findMany({
    where: { enabled: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const videoCategories = [...new Set(videos.map((v) => v.category))];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Learn</h1>
        <p className="mt-1 text-sm text-muted">
          The full ICT toolkit, free: complete setup playbooks with live checklists, video lessons, the stats, the
          killzones, the concepts, and futures sizing.
        </p>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Setup playbooks 📚</h2>
          <p className="text-xs text-muted">
            Open one during the session and check the boxes live — all green means A+ setup, anything missing means no
            trade. Tag the setup on your trades and the dashboard shows which one actually pays you.
          </p>
        </div>
        {PLAYBOOKS.map((pb) => (
          <PlaybookCard key={pb.id} pb={pb} />
        ))}
      </section>

      {videos.length > 0 && (
        <section className="space-y-4 pt-2">
          <div>
            <h2 className="text-base font-semibold">Video lessons 🎬</h2>
            <p className="text-xs text-muted">
              Hand-picked lessons on the concepts above. Watch one, then run its playbook checklist next session.
            </p>
          </div>
          {videoCategories.map((cat) => (
            <div key={cat} className="space-y-2">
              <h3 className="text-xs font-bold tracking-wide text-muted uppercase">{cat}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {videos
                  .filter((v) => v.category === cat)
                  .map((v) => (
                    <div key={v.id} className="card space-y-2 p-3">
                      <div className="aspect-video overflow-hidden rounded-lg bg-black">
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
                          title={v.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                          className="h-full w-full"
                        />
                      </div>
                      <p className="text-sm font-medium text-ink">
                        {v.title}
                        {v.minutes ? <span className="ml-1.5 text-xs font-normal text-muted">· {v.minutes} min</span> : null}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="card">
        <h2 className="card-title">How TradeZone works — 3 steps</h2>
        <ol className="space-y-3">
          {[
            ["Log every trade", "Add trades manually (the time is stamped for you), import a CSV, or connect your broker on Import & Sync. Tag the setup and the concepts you used."],
            ["Review the dashboard", "Filter by account, date, symbol, setup, direction, or killzone — and see exactly where your money comes from and where it leaks."],
            ["Collect achievements", "Green-day streaks, discipline badges, the Funded trophy — the dashboard tracks them automatically. Keep the streak alive."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-sm font-bold text-accent">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold">{t}</p>
                <p className="text-sm text-ink-2">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="card">
        <h2 className="card-title">The stats, in plain language</h2>
        <dl className="space-y-3">
          {STATS.map(([term, def]) => (
            <div key={term}>
              <dt className="text-sm font-semibold text-ink">{term}</dt>
              <dd className="text-sm text-ink-2">{def}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card">
        <h2 className="card-title">Killzones (New York time)</h2>
        <dl className="space-y-3">
          {KILLZONES.map(([term, def]) => (
            <div key={term}>
              <dt className="text-sm font-semibold text-accent">{term}</dt>
              <dd className="text-sm text-ink-2">{def}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted">
          TradeZone tags every trade's killzone automatically from its entry time — check "P&L by killzone" on the dashboard.
        </p>
      </section>

      <section className="card">
        <h2 className="card-title">ICT concepts glossary</h2>
        <dl className="space-y-3">
          {CONCEPTS.map(([term, def]) => (
            <div key={term}>
              <dt className="text-sm font-semibold text-ink">{term}</dt>
              <dd className="text-sm text-ink-2">{def}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card">
        <h2 className="card-title">Futures sizing cheat-sheet</h2>
        <p className="mb-3 text-sm text-ink-2">
          In TradeZone, <span className="font-semibold text-ink">size = contracts × dollars per point</span>, so P&L is
          always in real dollars: <code className="rounded bg-raised px-1.5 py-0.5 text-xs">(exit − entry) × size</code>.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-xs text-muted">
                <th className="py-2 pr-3 font-medium">Symbol</th>
                <th className="py-2 pr-3 font-medium">Market</th>
                <th className="py-2 pr-3 font-medium">$ / point</th>
                <th className="py-2 font-medium">Example</th>
              </tr>
            </thead>
            <tbody>
              {SIZES.map(([sym, market, ppt, ex]) => (
                <tr key={sym} className="border-b border-edge/50 last:border-0">
                  <td className="py-2 pr-3 font-semibold">{sym}</td>
                  <td className="py-2 pr-3 text-ink-2">{market}</td>
                  <td className="py-2 pr-3 tabular-nums text-ink-2">{ppt}</td>
                  <td className="py-2 text-muted">{ex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
