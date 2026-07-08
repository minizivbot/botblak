/**
 * Pro playbook library: complete ICT setups taught as executable checklists.
 * Each one is a 5-10 minute lesson a trader can run live during the session —
 * the checkboxes are the trade plan.
 */

export type Playbook = {
  id: string;
  emoji: string;
  name: string;
  tagline: string;
  window: string;
  difficulty: "Starter" | "Intermediate" | "Advanced";
  readMinutes: number;
  idea: string[];
  checklist: string[];
  invalidation: string[];
  mistakes: string[];
  proTip: string;
};

export const PLAYBOOKS: Playbook[] = [
  {
    id: "silver-bullet",
    emoji: "🔫",
    name: "Silver Bullet",
    tagline: "The one-hour window where an FVG entry is a scheduled event.",
    window: "10:00–11:00 or 14:00–15:00 NY time",
    difficulty: "Starter",
    readMinutes: 6,
    idea: [
      "The Silver Bullet is the most mechanical setup in ICT: inside one specific hour, you wait for a liquidity grab, a structure shift, and a Fair Value Gap — then you trade the FVG. Nothing else counts.",
      "Because the window is fixed, it kills the two things that destroy day traders: waiting all day (overtrading) and improvising (no plan). If the sequence doesn't complete inside the hour, there is no trade today — and that's a win too.",
      "The AM window (10–11am NY) plays off the reaction to the 9:30 open and any 10am news; the PM window (2–3pm) plays off the afternoon repricing. Pick ONE window and master it before touching the other.",
    ],
    checklist: [
      "It's inside the window (10:00–11:00 or 14:00–15:00 NY) — not 5 minutes before, not after",
      "Price swept an obvious liquidity pool (session high/low, previous hour high/low, equal highs/lows)",
      "Market Structure Shift after the sweep — a displacement candle broke the last swing against the sweep direction",
      "The displacement left a Fair Value Gap on the 1-5m chart",
      "Limit order inside the FVG (top of gap for shorts, bottom for longs)",
      "Stop beyond the sweep's extreme — not tighter, not wider",
      "Target = the opposite liquidity pool, minimum 2R — skip the trade if 2R isn't there",
    ],
    invalidation: [
      "The FVG is filled completely and price closes through it — the gap failed, don't re-enter",
      "The window expires before the sequence completes — stand down, no chase",
      "News drop inside the window (FOMC, CPI): let the first reaction finish; a violated setup stays dead",
    ],
    mistakes: [
      "Trading a random FVG with no liquidity sweep before it — the sweep IS the setup, the FVG is just the entry",
      "Entering on the first candle into the gap instead of placing a limit and letting price come to you",
      "Moving the stop 'a bit wider' — the sweep extreme is the line between a setup and a guess",
    ],
    proTip:
      "Tag each of these trades 'Silver Bullet' and check P&L by setup on the dashboard after 20 trades — most traders discover one window (AM or PM) massively outperforms the other for them.",
  },
  {
    id: "ote",
    emoji: "📐",
    name: "OTE — Optimal Trade Entry",
    tagline: "Buy the discount of a move you already believe in.",
    window: "Any killzone — best in London and NY AM",
    difficulty: "Starter",
    readMinutes: 6,
    idea: [
      "After an impulsive leg, price almost always retraces before continuing. The OTE is the 62–79% pocket of that retracement — the 'discount aisle' of a move that already showed its hand.",
      "The key insight: you're not predicting direction. The displacement leg already told you the direction. You're only deciding WHERE to join it — and OTE means joining deep, where your stop is small and the reward is the full continuation.",
      "Draw the Fibonacci from the swing low to the swing high of the impulse (for longs). The zone between 0.62 and 0.79 is the OTE. The 0.705 level (midpoint) is the classic limit price.",
    ],
    checklist: [
      "There was a real displacement leg — fast, one-directional, ideally leaving an FVG behind (not a slow grind)",
      "The leg took liquidity or shifted structure — it means something, it isn't noise",
      "Fib drawn on the impulse leg only, wick to wick",
      "Limit order at 0.705, inside the 0.62–0.79 pocket",
      "Stop just beyond the origin of the leg (below the swing low for longs)",
      "An FVG or Order Block overlaps the OTE pocket — confluence, not a naked fib",
      "Target: the high/low that started it, then the next liquidity pool — minimum 2R",
    ],
    invalidation: [
      "Price trades through 0.79 and closes beyond it — the retracement became a reversal",
      "The 'retracement' happens as fast as the impulse — that's not profit-taking, that's the other side winning",
      "Structure breaks against you on the timeframe of the fib before entry fills",
    ],
    mistakes: [
      "Drawing the fib on a range instead of an impulse — OTE only means something after displacement",
      "Entering at 50% because 'it looks deep enough' — the pocket exists because that's where stops make sense",
      "Taking OTEs against the higher-timeframe draw on liquidity — deep entry into a losing direction is still losing",
    ],
    proTip:
      "Tag these trades 'OTE' and compare your results WITH an overlapping FVG vs without on the dashboard — the confluence version usually doubles the expectancy.",
  },
  {
    id: "judas-swing",
    emoji: "🎭",
    name: "Judas Swing",
    tagline: "The opening fake-out that funds the real move.",
    window: "First 30–90 min of London (2:00) or NY (9:30)",
    difficulty: "Intermediate",
    readMinutes: 7,
    idea: [
      "Sessions rarely open and go straight to their real destination. The first move is often engineered to run the overnight/previous-session stops and trap breakout traders — that decoy is the Judas Swing.",
      "The playbook: let the open make its first move, watch it tag a liquidity pool (Asia high/low before London, overnight high/low before NY), and hunt the reversal — because the failed first move reveals the true direction for the session.",
      "This is Power of 3 in action: the Judas IS the Manipulation phase. You're deliberately trading against the session's first impression, which is why confirmation (structure shift + displacement) is non-negotiable.",
    ],
    checklist: [
      "Marked Asia range / overnight high & low BEFORE the session opened",
      "Session opened and pushed INTO one of those pools (the decoy direction)",
      "The pool was swept — wick through it, stops triggered",
      "Displacement back inside the range + Market Structure Shift on 1-5m",
      "Entry on the retrace into the FVG/OB left by the displacement",
      "Stop beyond the Judas extreme",
      "Target: the liquidity on the OPPOSITE side of the range — the session's real draw",
    ],
    invalidation: [
      "Price re-takes the Judas extreme after your entry — the 'fake' move was real, get out",
      "No displacement after the sweep — a slow drift back isn't a trap springing, it's a trend continuing",
      "High-impact news scheduled within 15 min — the sweep may be the warm-up, not the move",
    ],
    mistakes: [
      "Shorting the first push up just because 'it's probably a Judas' — without the sweep + shift it's just fading a trend",
      "Using it mid-session — the psychology only works around the open when overnight positions are getting flushed",
      "Expecting it every day — 2-3 clean Judas setups a week is normal; forcing the rest is donation",
    ],
    proTip:
      "Backtest tip: pull up the last 20 NY opens and mark how many days the 9:30–10:00 move was fully reversed by 11:00. That number is why this playbook exists.",
  },
  {
    id: "fvg-continuation",
    emoji: "🧲",
    name: "FVG Continuation",
    tagline: "Join the trend at the imbalance it left behind.",
    window: "Any killzone with an active trend",
    difficulty: "Starter",
    readMinutes: 5,
    idea: [
      "When price displaces with force it leaves Fair Value Gaps — three-candle imbalances where only one side traded. The market's tendency to revisit these gaps makes them the cleanest continuation entries in a trend.",
      "The trade: an established directional move, a pullback into the most recent clean FVG, and continuation to the next liquidity target. You're not calling tops or bottoms — you're getting a wholesale price inside an ongoing move.",
      "Not all gaps are equal. The FVG that formed WITH the structure break (the 'origin' gap) is the institutional footprint; the fifth gap of an extended move is exhaustion, not opportunity.",
    ],
    checklist: [
      "Clear trend context: structure making higher-highs/higher-lows (or the reverse) on your execution TF",
      "The FVG formed during displacement that broke structure or took liquidity",
      "Price is pulling back into the gap for the FIRST time (first presented FVG)",
      "The gap sits at a sensible retracement of the leg (not the very top of it)",
      "Entry: limit in the gap (consequent encroachment — the 50% of the gap — is the sniper level)",
      "Stop below the gap's far edge, or below the displacement origin for more room",
      "Target: next liquidity pool in trend direction, minimum 2R",
    ],
    invalidation: [
      "Candle CLOSES through the far side of the gap — the imbalance was rebalanced and rejected",
      "Structure shifts against the trend before price reaches your gap — the pullback became a reversal",
      "The gap gets revisited a third time — each touch weakens it; stale gaps are targets, not entries",
    ],
    mistakes: [
      "Trading every gap on the chart — only displacement gaps in trend context pay",
      "Full position at the gap's edge instead of scaling toward consequent encroachment",
      "Ignoring the higher-timeframe draw — a 5m FVG long into a 1h bearish order block is a coin toss",
    ],
    proTip:
      "In your trade notes, mark whether the gap held at its edge or at consequent encroachment. After 20 trades you'll know exactly which fill style your market prefers — then quote only that price.",
  },
  {
    id: "turtle-soup",
    emoji: "🐢",
    name: "Turtle Soup (Liquidity Sweep Reversal)",
    tagline: "Fade the breakout everyone else just bought.",
    window: "London & NY killzones; deadly at session highs/lows",
    difficulty: "Intermediate",
    readMinutes: 7,
    idea: [
      "Obvious highs and lows collect stops and breakout orders. When price finally pokes through and instantly fails, every one of those breakout traders is trapped — and their exits fuel your trade. That failure pattern is Turtle Soup.",
      "The setup hunts 'clean' levels: equal highs, yesterday's high/low, the week's high/low — the more obvious the level, the better the trap. You want a sweep (a wick through), not a breakout (a close through). That distinction is the entire trade.",
      "It pairs naturally with SMT divergence: if ES sweeps its high but NQ refuses to make one, the sweep is showing you smart money's hand.",
    ],
    checklist: [
      "Identified an OBVIOUS pool: equal highs/lows, PDH/PDL, week high/low — something everyone can see",
      "Price wicks through the level but fails to CLOSE beyond it",
      "Rejection is immediate — within 1-3 candles, not a slow float above the level",
      "Bonus confluence: SMT divergence with the correlated market (ES/NQ), or it happens inside a killzone",
      "Structure shift on the lower timeframe confirms the reversal",
      "Entry on the retrace (FVG/OB from the rejection), stop beyond the sweep wick",
      "Target: the opposite side of the range — the liquidity the market ACTUALLY wanted",
    ],
    invalidation: [
      "A candle closes decisively beyond the swept level — that's acceptance, the breakout is real",
      "Price consolidates above/below the level instead of rejecting — building, not trapping",
      "You're fading a fresh high in a strong trend day with no divergence — that's not soup, that's the trend",
    ],
    mistakes: [
      "Shorting the wick in real-time before the rejection candle closes — half of sweeps become breakouts",
      "Using it on minor intraday levels nobody's stops sit behind — no fuel, no reversal",
      "Skipping the structure shift 'because the wick was big' — size of the wick isn't confirmation",
    ],
    proTip:
      "Track the 'sweep vs breakout' stat per symbol in your trade notes. Indices love turtle soup; crude oil breaks and runs — the dashboard's P&L by symbol will show which market respects your fades.",
  },
  {
    id: "power-of-3",
    emoji: "🎬",
    name: "Power of 3 (AMD)",
    tagline: "Read the whole session as three acts — trade only the third.",
    window: "Full session framework (daily and weekly too)",
    difficulty: "Advanced",
    readMinutes: 8,
    idea: [
      "Accumulation, Manipulation, Distribution. Nearly every session tells this story: a quiet range builds positions (A), a false move runs the stops and creates the day's extreme (M), then the real move delivers price to its target (D).",
      "Trading it means refusing to touch acts one and two. The range chop eats scalpers, the manipulation leg traps breakout traders — your entire job is to recognize when act two has completed and position for act three.",
      "The open price is the anchor: in a bullish AMD day, the manipulation dips BELOW the open (and often below an obvious low) before distribution rallies away. Above the open = discount long territory gone.",
      "This framework contains the others: the Judas Swing IS the M phase at the open; the Silver Bullet often fires the first leg of D. Power of 3 is the map — the other playbooks are entries on it.",
    ],
    checklist: [
      "Higher-timeframe bias set BEFORE the session (draw on liquidity: which old high/low is price being pulled to?)",
      "Accumulation identified: pre-open or early-session range with defined high/low",
      "Manipulation: a run of the range extreme AGAINST your bias (below open for longs) that sweeps liquidity",
      "Displacement + structure shift back through the range confirms M is complete",
      "Entry inside the FVG/OB of the displacement leg — this is act three's first pullback",
      "Stop beyond the manipulation extreme (that level should never trade again if you're right)",
      "Hold through act three: target the draw on liquidity, manage partials at intermediate pools",
    ],
    invalidation: [
      "Price re-takes the manipulation extreme — your read of which act you're in was wrong; flat, reassess",
      "No displacement after the sweep by mid-killzone — the day may be a range day; AMD needs expansion",
      "Your HTF bias flips (news, breached weekly level) — the target moved, the trade story is over",
    ],
    mistakes: [
      "Labeling AMD in hindsight but trading the middle of the chart in real-time — the checklist exists to force patience",
      "Counter-trend scalping during accumulation 'while waiting' — that's how the day's loss limit dies before the setup arrives",
      "Assuming every day is AMD — consolidation days exist; no manipulation leg means no trade, not a forced one",
    ],
    proTip:
      "Journal each day with a one-line AMD read at the close ('M was the 9:45 low sweep, D ran to PDH'). After a month you'll recognize act two in real-time — that skill compounds more than any single entry.",
  },
];
