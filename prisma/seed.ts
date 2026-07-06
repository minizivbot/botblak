import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

type SeedTrade = {
  symbol: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number;
  size: number; // contracts x $/point
  fees: number;
  entryDate: string;
  exitDate: string;
  strategy: string;
  notes: string;
};

// 30 realistic ICT-style futures trades (MES/ES $5|$50 per pt, MNQ/NQ $2|$20
// per pt, MGC $10 per pt, CL $1,000 per $1). Entry times sit inside ICT
// killzones (ET): London 02:00-05:00, NY AM 07:00-10:00, London Close
// (AM Silver Bullet) 10:00-11:00, NY PM 13:30-16:00. Times below are UTC (EDT+4).
const trades: SeedTrade[] = [
  { symbol: "MES", direction: "LONG", entryPrice: 6902.25, exitPrice: 6918.5, size: 10, fees: 5.0, entryDate: "2026-04-27T14:03:00Z", exitDate: "2026-04-27T15:40:00Z", strategy: "Silver Bullet", notes: "2 MES ($5/pt). 10:03 AM SB — 5m FVG after the run on Asia highs, targeted the PM session liquidity." },
  { symbol: "MNQ", direction: "SHORT", entryPrice: 25180, exitPrice: 25212, size: 6, fees: 7.5, entryDate: "2026-04-28T11:35:00Z", exitDate: "2026-04-28T12:10:00Z", strategy: "Judas Swing", notes: "3 MNQ ($2/pt). Read the NY open push as the Judas leg — it was real expansion. Stopped above the open." },
  { symbol: "ES", direction: "LONG", entryPrice: 6895, exitPrice: 6907.75, size: 50, fees: 9.0, entryDate: "2026-04-29T13:15:00Z", exitDate: "2026-04-30T18:30:00Z", strategy: "Order Block", notes: "1 ES ($50/pt). Daily bullish OB held on the retest, swing into next day's buy-side draw." },
  { symbol: "MGC", direction: "LONG", entryPrice: 4212.4, exitPrice: 4198.7, size: 20, fees: 5.0, entryDate: "2026-04-30T07:20:00Z", exitDate: "2026-04-30T08:45:00Z", strategy: "FVG", notes: "2 MGC ($10/pt). London 15m FVG fill kept going through it — no displacement behind the gap." },
  { symbol: "CL", direction: "SHORT", entryPrice: 68.42, exitPrice: 67.55, size: 1000, fees: 5.0, entryDate: "2026-05-01T14:40:00Z", exitDate: "2026-05-01T19:20:00Z", strategy: "Liquidity Sweep", notes: "1 CL ($1,000/$1). Inventory pop swept Tuesday's high into a bearish breaker — rode it to the sell-side pool." },
  { symbol: "MES", direction: "SHORT", entryPrice: 7010.5, exitPrice: 6994.25, size: 15, fees: 7.5, entryDate: "2026-05-04T13:45:00Z", exitDate: "2026-05-04T15:30:00Z", strategy: "Power of 3", notes: "3 MES. Accumulation under the open, manipulation above PDH, distribution lower — textbook AMD." },
  { symbol: "MNQ", direction: "LONG", entryPrice: 25310, exitPrice: 25398, size: 8, fees: 10.0, entryDate: "2026-05-05T11:50:00Z", exitDate: "2026-05-05T19:40:00Z", strategy: "SMT Divergence", notes: "4 MNQ. ES made a lower low into 8:00, NQ held — SMT at the sell-side sweep. Held through lunch to PM highs." },
  { symbol: "MES", direction: "LONG", entryPrice: 7025, exitPrice: 7016.75, size: 10, fees: 5.0, entryDate: "2026-05-06T12:00:00Z", exitDate: "2026-05-06T12:50:00Z", strategy: "OTE", notes: "2 MES. 62% retrace entry but the swing had already filled its draw. Scratched at the stop." },
  { symbol: "MGC", direction: "LONG", entryPrice: 4241.2, exitPrice: 4259.6, size: 30, fees: 7.5, entryDate: "2026-05-07T06:40:00Z", exitDate: "2026-05-07T09:15:00Z", strategy: "Judas Swing", notes: "3 MGC. London Judas below Asia low, MSS on 5m, long into the London session expansion." },
  { symbol: "MES", direction: "SHORT", entryPrice: 7042, exitPrice: 7051.5, size: 10, fees: 5.0, entryDate: "2026-05-08T15:10:00Z", exitDate: "2026-05-08T15:50:00Z", strategy: "FVG", notes: "2 MES. Shorted into a 5m FVG on a one-sided trend day. Fighting the daily bias again." },
  { symbol: "MNQ", direction: "SHORT", entryPrice: 25490, exitPrice: 25402, size: 4, fees: 5.0, entryDate: "2026-05-11T17:35:00Z", exitDate: "2026-05-11T19:55:00Z", strategy: "Silver Bullet", notes: "2 MNQ. PM SB (2-3pm): sweep of the lunch high into a bearish FVG, target the AM session low." },
  { symbol: "ES", direction: "LONG", entryPrice: 7038, exitPrice: 7049.25, size: 50, fees: 9.0, entryDate: "2026-05-12T13:35:00Z", exitDate: "2026-05-12T15:20:00Z", strategy: "Liquidity Sweep", notes: "1 ES. 9:35 sweep of the overnight low, displacement up, entered the first discount array." },
  { symbol: "MES", direction: "LONG", entryPrice: 7055, exitPrice: 7048.5, size: 20, fees: 10.0, entryDate: "2026-05-13T14:20:00Z", exitDate: "2026-05-13T14:55:00Z", strategy: "Silver Bullet", notes: "4 MES. SB window FVG never got the displacement leg — the gap was inversion. -6.5 pts." },
  { symbol: "CL", direction: "LONG", entryPrice: 66.8, exitPrice: 66.35, size: 1000, fees: 5.0, entryDate: "2026-05-14T14:25:00Z", exitDate: "2026-05-14T17:50:00Z", strategy: "Order Block", notes: "1 CL. H1 OB failed on the OPEC headline — news ran the stops through the array." },
  { symbol: "MNQ", direction: "LONG", entryPrice: 25520, exitPrice: 25601, size: 6, fees: 7.5, entryDate: "2026-05-15T11:45:00Z", exitDate: "2026-05-15T19:50:00Z", strategy: "OTE", notes: "3 MNQ. OTE off the 8:30 data spike low, 62-79% zone with a 15m FVG confluence. Runner to the close." },
  { symbol: "MES", direction: "LONG", entryPrice: 7068.25, exitPrice: 7082, size: 15, fees: 7.5, entryDate: "2026-05-18T13:40:00Z", exitDate: "2026-05-18T16:30:00Z", strategy: "Breaker", notes: "3 MES. Bullish breaker from Friday's high, entered the retest at 9:40." },
  { symbol: "MGC", direction: "SHORT", entryPrice: 4290, exitPrice: 4302.3, size: 20, fees: 5.0, entryDate: "2026-05-19T18:15:00Z", exitDate: "2026-05-19T19:05:00Z", strategy: "Liquidity Sweep", notes: "2 MGC. Faded the Fed-minutes spike calling it a sweep — it was a genuine repricing. News > arrays." },
  { symbol: "MES", direction: "SHORT", entryPrice: 7095, exitPrice: 7079.75, size: 25, fees: 12.5, entryDate: "2026-05-20T14:05:00Z", exitDate: "2026-05-20T19:45:00Z", strategy: "Silver Bullet", notes: "5 MES. Best trade of the month: 10:05 sweep of PDH, MSS, bearish FVG entry, scaled thirds to the sell-side pool." },
  { symbol: "MNQ", direction: "LONG", entryPrice: 25630, exitPrice: 25668, size: 4, fees: 5.0, entryDate: "2026-05-21T17:45:00Z", exitDate: "2026-05-21T19:35:00Z", strategy: "FVG", notes: "2 MNQ. PM 5m FVG with the trend, small size after yesterday's big day, banked +38 pts." },
  { symbol: "ES", direction: "SHORT", entryPrice: 7102, exitPrice: 7089.5, size: 50, fees: 9.0, entryDate: "2026-05-22T17:45:00Z", exitDate: "2026-05-22T19:50:00Z", strategy: "Power of 3", notes: "1 ES. Friday PM distribution after the week's high got swept — sold the redelivery into the close." },
  { symbol: "MES", direction: "LONG", entryPrice: 7110, exitPrice: 7104.75, size: 10, fees: 5.0, entryDate: "2026-05-26T13:35:00Z", exitDate: "2026-05-26T14:10:00Z", strategy: "Judas Swing", notes: "2 MES. Holiday-week open, no real manipulation leg to read. Scratched fast." },
  { symbol: "CL", direction: "SHORT", entryPrice: 71.15, exitPrice: 70.42, size: 1000, fees: 5.0, entryDate: "2026-05-27T14:35:00Z", exitDate: "2026-05-27T18:20:00Z", strategy: "Order Block", notes: "1 CL. Bearish H1 OB above the inventory number, rode the flush to the discount array." },
  { symbol: "MNQ", direction: "SHORT", entryPrice: 25780, exitPrice: 25842, size: 6, fees: 7.5, entryDate: "2026-05-28T15:20:00Z", exitDate: "2026-05-28T16:05:00Z", strategy: "SMT Divergence", notes: "3 MNQ. Called SMT against ES on an AI-headline day — correlation breaks on news. Cut fast." },
  { symbol: "MES", direction: "LONG", entryPrice: 7118.5, exitPrice: 7136.25, size: 15, fees: 7.5, entryDate: "2026-05-29T11:55:00Z", exitDate: "2026-05-29T19:55:00Z", strategy: "OTE", notes: "3 MES. Month-end markup: OTE off the 8am low, held the runner into the 3:50 MOC." },
  { symbol: "MGC", direction: "LONG", entryPrice: 4318.6, exitPrice: 4337.2, size: 20, fees: 5.0, entryDate: "2026-06-01T06:45:00Z", exitDate: "2026-06-01T13:40:00Z", strategy: "Breaker", notes: "2 MGC. London breaker above the ATH consolidation, held through the NY continuation." },
  { symbol: "MES", direction: "SHORT", entryPrice: 7150, exitPrice: 7159.25, size: 10, fees: 5.0, entryDate: "2026-06-02T14:20:00Z", exitDate: "2026-06-02T15:00:00Z", strategy: "FVG", notes: "2 MES. Counter-trend short at a premium FVG in a strong bull leg. Respected the stop." },
  { symbol: "MNQ", direction: "LONG", entryPrice: 25890, exitPrice: 25972, size: 8, fees: 10.0, entryDate: "2026-06-03T13:35:00Z", exitDate: "2026-06-03T17:25:00Z", strategy: "Liquidity Sweep", notes: "4 MNQ. 9:35 turtle soup under the Asia low, MSS, long to the buy-side pool at the PDH." },
  { symbol: "ES", direction: "LONG", entryPrice: 7141, exitPrice: 7127.75, size: 50, fees: 9.0, entryDate: "2026-06-05T12:25:00Z", exitDate: "2026-06-05T13:30:00Z", strategy: "OTE", notes: "1 ES. Full size into NFP at an OTE level — the number ran both sides. Should have been flat." },
  { symbol: "MES", direction: "LONG", entryPrice: 7133, exitPrice: 7151.5, size: 20, fees: 10.0, entryDate: "2026-06-16T14:10:00Z", exitDate: "2026-06-16T19:35:00Z", strategy: "Silver Bullet", notes: "4 MES. Two inside days, SB sweep of both, displacement north — let the runner work to the PM." },
  { symbol: "CL", direction: "LONG", entryPrice: 69.2, exitPrice: 70.05, size: 1000, fees: 5.0, entryDate: "2026-06-23T14:10:00Z", exitDate: "2026-06-24T17:45:00Z", strategy: "Order Block", notes: "1 CL. Daily bullish OB at the discount of the new range, two-day hold to the measured draw." },
];

const journalEntries = [
  { date: "2026-05-20", mood: 4, discipline: 5, notes: "Waited for the 10am Silver Bullet window instead of forcing the open. Sweep of PDH, clean MSS, FVG entry — scaled thirds exactly like the plan.", lessons: "The setup comes to the killzone. I don't have to trade the 9:30 candle to catch the move." },
  { date: "2026-05-26", mood: 2, discipline: 3, notes: "Holiday-week open with no clear manipulation leg. Took the Judas read anyway and scratched fast — at least the loss was small.", lessons: "No draw on liquidity, no trade. Half size on low-volume weeks." },
  { date: "2026-06-05", mood: 2, discipline: 2, notes: "Held a full ES into NFP at an OTE level like it was a normal morning. The number ran both sides of the book and took my stop in minutes.", lessons: "Flat into tier-1 news, no exceptions. The cleanest array means nothing when the algorithm is repricing." },
  { date: "2026-06-16", mood: 5, discipline: 5, notes: "Two inside days marked out the night before. SB window swept both sides, displacement north, entered the FVG and let the runner work.", lessons: "Marking the liquidity the night before removes every ounce of hesitation at the trigger." },
];

async function main() {
  // On a database that already has real (non-seed) trades, do nothing —
  // this keeps production deploys from touching user data.
  const realTrades = await prisma.trade.count({ where: { source: { not: "seed" } } });
  if (realTrades > 0) {
    console.log(`Found ${realTrades} user trades — skipping sample-data seed.`);
    return;
  }

  // Demo account that owns the sample data. Sign in with demo / demo1234.
  const demo = await prisma.user.upsert({
    where: { username: "demo" },
    update: {},
    create: { username: "demo", passwordHash: hashPassword("demo1234") },
  });

  // Two demo trading accounts — a personal one and a copy-trading one.
  const mainAcc = await prisma.account.upsert({
    where: { userId_name: { userId: demo.id, name: "Main" } },
    update: {},
    create: { userId: demo.id, name: "Main" },
  });
  // The copy account doubles as a tracked prop-firm challenge in the demo.
  const copyProp = {
    isCopy: true,
    propStartBalance: 50000,
    propProfitTarget: 3000,
    propMaxDrawdown: 2000,
    propDrawdownType: "trailing",
  };
  const copyAcc = await prisma.account.upsert({
    where: { userId_name: { userId: demo.id, name: "Copy — Prop" } },
    update: copyProp,
    create: { userId: demo.id, name: "Copy — Prop", ...copyProp },
  });
  // A second copy account so the demo shows how copy accounts collapse into
  // one "Copy only" group in the switcher.
  const copyAcc2 = await prisma.account.upsert({
    where: { userId_name: { userId: demo.id, name: "Copy — Apex" } },
    update: { isCopy: true },
    create: { userId: demo.id, name: "Copy — Apex", isCopy: true },
  });

  await prisma.trade.deleteMany({ where: { userId: demo.id, source: "seed" } });

  // Derive ICT concept tags from each trade's setup + notes so the demo shows
  // a populated "P&L by concept" breakdown.
  const CONCEPT_KEYWORDS = [
    "FVG", "Order Block", "Breaker", "Liquidity Sweep", "MSS", "BOS",
    "SMT Divergence", "OTE", "Judas Swing", "Power of 3", "Silver Bullet",
    "Turtle Soup", "Draw on Liquidity", "Equal Highs/Lows",
  ];
  const conceptsFor = (t: SeedTrade): string => {
    const hay = `${t.strategy} ${t.notes}`.toLowerCase();
    const found = new Set<string>();
    for (const k of CONCEPT_KEYWORDS) if (hay.includes(k.toLowerCase())) found.add(k);
    if (t.strategy) found.add(t.strategy);
    if (found.size === 0) found.add("FVG");
    return [...found].slice(0, 4).join(", ");
  };

  for (const [i, t] of trades.entries()) {
    await prisma.trade.create({
      data: {
        ...t,
        entryDate: new Date(t.entryDate),
        exitDate: new Date(t.exitDate),
        concepts: conceptsFor(t),
        source: "seed",
        userId: demo.id,
        // ~half the trades sit in Main; the rest split across the two copy
        // accounts (which collapse into "Copy only" in the UI).
        accountId: i % 2 === 0 ? mainAcc.id : i % 4 === 1 ? copyAcc.id : copyAcc2.id,
      },
    });
  }

  // A funded/passed prop account so the demo shows the "challenge passed" state.
  const funded = {
    isCopy: false,
    propStartBalance: 50000,
    propProfitTarget: 3000,
    propMaxDrawdown: 2000,
    propDrawdownType: "trailing",
    propFunded: true,
  };
  const fundedAcc = await prisma.account.upsert({
    where: { userId_name: { userId: demo.id, name: "Prop 50K — Funded ✓" } },
    update: funded,
    create: { userId: demo.id, name: "Prop 50K — Funded ✓", ...funded },
  });
  // 20 mostly-winning MES trades that clear the $3,000 target (~+$3,180 net).
  let fday = new Date("2026-05-04T13:40:00Z").getTime();
  for (let i = 0; i < 20; i++) {
    const winTrade = i % 5 !== 0; // 16 winners, 4 losers
    const move = winTrade ? 26 : -22; // points on 2 MES ($5/pt)
    await prisma.trade.create({
      data: {
        userId: demo.id,
        accountId: fundedAcc.id,
        symbol: "MES",
        direction: "LONG",
        entryPrice: 6900,
        exitPrice: 6900 + move,
        size: 10,
        fees: 2.5,
        entryDate: new Date(fday),
        exitDate: new Date(fday + 3600e3),
        strategy: "Silver Bullet",
        concepts: "Silver Bullet, FVG, Liquidity Sweep",
        source: "seed",
      },
    });
    fday += 86400e3;
  }

  for (const j of journalEntries) {
    await prisma.journalEntry.upsert({
      where: { userId_date: { userId: demo.id, date: j.date } },
      update: j,
      create: { ...j, userId: demo.id },
    });
  }

  await prisma.settings.upsert({
    where: { userId: demo.id },
    update: {},
    create: { userId: demo.id, startingBalance: 25000, currency: "USD" },
  });

  // A few sample competitors so the public leaderboard looks alive. Each gets
  // a small run of MES trades with a fixed edge so ranks are deterministic.
  const competitors = [
    { username: "sniper_fx", win: 0.72, n: 40, funded: true },
    { username: "liquidity_hunter", win: 0.61, n: 32, funded: true },
    { username: "killzone_kid", win: 0.55, n: 28, funded: false },
    { username: "fvg_flow", win: 0.48, n: 24, funded: false },
    { username: "asia_range", win: 0.4, n: 20, funded: false },
  ];
  for (const c of competitors) {
    const u = await prisma.user.upsert({
      where: { username: c.username },
      update: {},
      create: { username: c.username, passwordHash: hashPassword("demo1234") },
    });
    await prisma.trade.deleteMany({ where: { userId: u.id, source: "seed" } });
    let day = new Date("2026-05-01T14:00:00Z").getTime();
    for (let i = 0; i < c.n; i++) {
      const winTrade = i / c.n < c.win;
      const move = winTrade ? 12 : -8; // points on 2 MES ($5/pt) → +$120 / -$80
      await prisma.trade.create({
        data: {
          userId: u.id,
          symbol: "MES",
          direction: "LONG",
          entryPrice: 6900,
          exitPrice: 6900 + move,
          size: 10, // 2 MES x $5/pt
          fees: 2.5,
          entryDate: new Date(day),
          exitDate: new Date(day + 3600e3),
          strategy: "Silver Bullet",
          source: "seed",
        },
      });
      day += 86400e3;
    }
    if (c.funded) {
      await prisma.account.upsert({
        where: { userId_name: { userId: u.id, name: "Funded" } },
        update: { propFunded: true, isCopy: false, propStartBalance: 50000, propProfitTarget: 3000 },
        create: { userId: u.id, name: "Funded", propFunded: true, propStartBalance: 50000, propProfitTarget: 3000 },
      });
    }
  }

  // Curated prop firms for the affiliate section. Fill in your own referral
  // links via the admin panel; these seed only the names/blurbs (upsert-safe,
  // never overwrites an affiliate URL you've already set).
  const firms = [
    { name: "Apex Trader Funding", emoji: "🚀", blurb: "One of the largest futures prop firms. Frequent 80–90% off evaluation sales and up to 20 accounts.", sortOrder: 1 },
    { name: "TakeProfit Trader", emoji: "🎯", blurb: "Futures evaluations with a real payout-from-day-one funded model and a one-step challenge.", sortOrder: 2 },
    { name: "MyFundedFutures", emoji: "📈", blurb: "Popular no-time-limit futures challenges with several plan types (Starter, Expert, Milestone).", sortOrder: 3 },
    { name: "Tradeify", emoji: "⚡", blurb: "Futures funding with instant-funding options and straightforward consistency rules.", sortOrder: 4 },
    { name: "Topstep", emoji: "🏔️", blurb: "The veteran futures combine. Well-known Trading Combine → Express Funded path.", sortOrder: 5 },
    { name: "Bulenox", emoji: "🐂", blurb: "Futures evaluations with flexible reset options and regular discount codes.", sortOrder: 6 },
    { name: "FundedNext", emoji: "🌟", blurb: "Large multi-asset prop firm expanding into futures, with frequent promos.", sortOrder: 7 },
    { name: "Alpha Futures", emoji: "🅰️", blurb: "Newer futures firm with trader-friendly rules and consistent payouts.", sortOrder: 8 },
    { name: "TradeDay", emoji: "📅", blurb: "Futures evaluations with real-data feeds and a straightforward funded path.", sortOrder: 9 },
    { name: "Earn2Trade", emoji: "🎓", blurb: "Futures education + the Gauntlet Mini evaluation to a funded account.", sortOrder: 10 },
    { name: "Legends Trading", emoji: "🏅", blurb: "Futures prop firm with flexible plans and frequent discount codes.", sortOrder: 11 },
  ];
  for (const f of firms) {
    const existing = await prisma.propFirm.findFirst({ where: { name: f.name } });
    if (existing) {
      await prisma.propFirm.update({ where: { id: existing.id }, data: { blurb: f.blurb, emoji: f.emoji, sortOrder: f.sortOrder } });
    } else {
      await prisma.propFirm.create({ data: f });
    }
  }

  console.log(
    `Seeded demo account (demo / demo1234) with ${trades.length} futures trades and ${journalEntries.length} journal entries.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
