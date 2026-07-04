/**
 * ICT Daily Motivation — one entry per day, rotating deterministically by
 * date so everyone (and every refresh) sees the same speech on the same day.
 */

export type DailySpeech = {
  title: string;
  quote: string;
  speech: string[];
  focus: string[];
};

export const SPEECHES: DailySpeech[] = [
  {
    title: "One setup, traded perfectly",
    quote: "You don't need every move. You need your move, executed the same way, a hundred times.",
    speech: [
      "The market will offer you twenty temptations today and maybe one real setup. The amateur takes five of the temptations and misses the setup because he's already tilted. The professional lets nineteen moves leave without him and feels nothing.",
      "Your edge is not knowing more concepts than everyone else — it's the boring repetition of one model, in one killzone, with one risk number. Boring is what pays.",
    ],
    focus: ["Define the ONE setup you're allowed to trade today", "If price isn't at your level, hands off the keyboard", "Journal the trades you didn't take — that's discipline made visible"],
  },
  {
    title: "The killzone is your office",
    quote: "Show up when the algorithm shows up. The rest of the day you are a spectator, not an employee.",
    speech: [
      "You don't owe the market twelve hours of screen time. Price is engineered in windows — London, New York AM, the PM session. Outside them, you're donating spread and attention to nothing.",
      "Treat your killzone like a shift: arrive early, mark your levels, do your job, clock out. A trader with two focused hours beats a trader with ten distracted ones, every week of the year.",
    ],
    focus: ["Be seated 15 minutes before your killzone opens", "Mark PDH/PDL and the liquidity pools before the window", "When the killzone closes, you close — no overtime revenge"],
  },
  {
    title: "Losses are tuition, not theft",
    quote: "A stop-out at your level with your size is a business expense. Only undisciplined losses are actual losses.",
    speech: [
      "You will lose today, this week, this month — that's in the contract you signed when you became a trader. The question is only whether your losses are clean: planned level, planned size, planned invalidation.",
      "A clean loss needs no recovery trade. It needs a note in the journal and a cup of water. The account that survives is the one whose losses are all boring.",
    ],
    focus: ["Decide your max daily loss before the open — in dollars", "One clean stop-out = still a good day of execution", "No position sizing 'to win it back'. Ever."],
  },
  {
    title: "The Judas swing tests your patience first",
    quote: "The first move is for the impatient. The real move is for the prepared.",
    speech: [
      "Every session opens with a lie — a push designed to make you commit early and wrong. You know this. You've journaled it fifty times. So why would you take the bait at 9:31?",
      "Let the manipulation leg print. Let the stops get swept. Your entry lives on the other side of everyone else's panic, and it will still be there after you've breathed.",
    ],
    focus: ["No entries in the first 5 minutes of the session", "Ask: whose stops just got taken? Am I the liquidity?", "Wait for displacement before you trust direction"],
  },
  {
    title: "Your journal is your real mentor",
    quote: "The market repeats itself. So do you. The journal is where you catch both.",
    speech: [
      "Every trader has patterns: the Tuesday overtrade, the post-win double-size, the FVG you force when the day is slow. None of them are visible in the moment — all of them are obvious in the journal.",
      "Ten minutes of honest review after the close is worth more than three new concepts from YouTube. You already know enough to be profitable. You don't yet know yourself enough.",
    ],
    focus: ["Log every trade today — including the shame ones", "Write one sentence: why did I really enter?", "Review last week's losers for one repeating mistake"],
  },
  {
    title: "Flat is a position",
    quote: "Standing aside when there's no draw on liquidity is the most underrated trade in the book.",
    speech: [
      "If you can't name where price is being drawn to — which pool, which gap, which old high — then you don't have a trade, you have a coin flip with fees.",
      "Professionals are flat most of the time. It doesn't feel like progress, but the account measures process, not activity. There will be a clean draw tomorrow. There always is.",
    ],
    focus: ["Name the draw on liquidity out loud before any entry", "No draw, no trade — write 'NO TRADE' in the journal proudly", "Spend the free time back-testing one killzone"],
  },
  {
    title: "Size is the silent killer",
    quote: "Nobody blows up because their analysis was bad. They blow up because their size made bad analysis fatal.",
    speech: [
      "Your read can be wrong five times in a row and your career survives — if your risk per trade is small and constant. Your read can be right seventy percent of the time and you still go to zero — if you size by feelings.",
      "Confidence is not a position-sizing input. The setup either qualifies for your standard risk or it doesn't qualify at all.",
    ],
    focus: ["Same risk per trade, all day, no exceptions", "Volatile session? Cut size in half, not double it", "Check: does one full loss change tomorrow's plan? It shouldn't"],
  },
  {
    title: "News is not your setup",
    quote: "When the calendar is red, the algorithm reprices. Your beautiful array means nothing mid-repricing.",
    speech: [
      "CPI, NFP, FOMC — these are not opportunities, they are weather events. The trader who's flat into the number can exploit what happens after. The trader who's positioned into it is just a passenger.",
      "Let the spike take both sides. Let the dust settle into a real dealing range. Then do your job inside the range like any other day.",
    ],
    focus: ["Check the economic calendar before your first trade", "Flat 10 minutes before tier-1 news, no exceptions", "Trade the post-news range, never the spike"],
  },
  {
    title: "Process over P&L",
    quote: "You can execute perfectly and lose today. You can gamble and win today. Only one of those compounds.",
    speech: [
      "The dollar number at the close is the noisiest possible measure of whether you traded well. Grade yourself on the checklist instead: right killzone, right setup, right size, right exit, honest journal.",
      "Five green checkmarks on a red day is a win. Five red checkmarks on a green day is a loan the market will collect with interest.",
    ],
    focus: ["Score today 1–5 on discipline, not on dollars", "A rule followed is a rep. Reps build the career", "Say it before the open: I am paid to execute, not to predict"],
  },
  {
    title: "The market owes you nothing today",
    quote: "There is no quota. Monday doesn't know you need rent, and the algorithm doesn't know you're down this week.",
    speech: [
      "Need is the most expensive emotion in trading. The moment you need a trade to work, you'll see setups that aren't there and ignore invalidations that are.",
      "Come to the screen with zero expectations and a full checklist. If the market hands you nothing clean, hand it nothing back. Your consistency is built on the days you refused to force it.",
    ],
    focus: ["No profit target for the day — only execution targets", "Catch yourself saying 'it has to' — that's the tell", "Down this week? Reduce size, don't increase frequency"],
  },
  {
    title: "SMT whispers, it doesn't shout",
    quote: "Divergence at the right level in the right window is a gift. Divergence in the middle of nowhere is a trap you built yourself.",
    speech: [
      "Concepts don't pay by themselves — context pays. An SMT divergence means something at a swept low inside a killzone with displacement behind it. The same divergence at 12:40 in the lunch chop means the two indices had different lunch orders.",
      "Stack your confluences like a professional: level, liquidity, time, structure. If you have to squint, you don't have it.",
    ],
    focus: ["Minimum three confluences or no entry", "Time of day is a confluence — respect the lunch", "One A+ trade beats four B- trades. Wait for the A+"],
  },
  {
    title: "Protect the equity curve's slope",
    quote: "Drawdown is the tax on impatience. Your job is not maximum profit — it's minimum regret per trade.",
    speech: [
      "Look at your equity curve. Every ugly cliff on it has a story, and the story is never 'my analysis was slightly off.' It's 'I doubled down,' 'I traded the off-hours,' 'I skipped the journal for a week.'",
      "Smoothness comes from sameness. Same risk, same windows, same model, same review. Make the next thirty trades identical in everything except the chart.",
    ],
    focus: ["Review your last drawdown — name the rule that broke", "Three losses in a row = done for the day, automatically", "Consistency this week beats brilliance today"],
  },
  {
    title: "You are building a career, not catching a trade",
    quote: "The goal was never today. The goal is still being here, sharper and funded, in year five.",
    speech: [
      "Zoom out. One trade is noise. One week is noise. What compounds is the trader you are becoming: the levels marked every night, the killzone kept every session, the journal that never misses a day.",
      "Prop firms, funding, size — all of it arrives as a side effect of one thing: being the person whose process doesn't wobble. Build that person today, one boring rule at a time.",
    ],
    focus: ["Do tonight's prep even if today went badly", "Measure the streak that matters: days of followed rules", "Tell yourself the truth in the journal — future you is reading"],
  },
  {
    title: "Displacement or it didn't happen",
    quote: "Conviction is shown by candles, not by your feelings about the level.",
    speech: [
      "You marked the level, price touched it — and now you want to believe. But belief isn't the trigger. Energy is. If the move away from your level doesn't displace — full-bodied candles, a gap left behind — then the level was just a price, not a decision.",
      "Demand that the market proves intent before you pay for a ticket. You're not early when you wait for displacement — you're solvent.",
    ],
    focus: ["Touch ≠ trigger: wait for the displacement leg", "Entry lives in the gap the displacement leaves behind", "If it never displaces, the level failed — and saved you money"],
  },
];

/** Deterministic pick for a given date (UTC), rotating through SPEECHES. */
export function dailySpeech(date = new Date()): { speech: DailySpeech; index: number } {
  const dayNumber = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000);
  const index = dayNumber % SPEECHES.length;
  return { speech: SPEECHES[index], index };
}
