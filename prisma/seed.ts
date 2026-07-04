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

// 30 realistic futures trades (MES/ES $5|$50 per pt, MNQ/NQ $2|$20 per pt,
// MGC $10 per pt, CL $1,000 per $1) over the ~10 weeks before the seed date.
const trades: SeedTrade[] = [
  { symbol: "MES", direction: "LONG", entryPrice: 6902.25, exitPrice: 6918.5, size: 10, fees: 5.0, entryDate: "2026-04-27T13:35:00Z", exitDate: "2026-04-27T15:10:00Z", strategy: "Opening Range", notes: "2 MES ($5/pt). Opening range break held above VWAP, took +16 pts into prior high." },
  { symbol: "MNQ", direction: "SHORT", entryPrice: 25180, exitPrice: 25212, size: 6, fees: 7.5, entryDate: "2026-04-28T14:05:00Z", exitDate: "2026-04-28T14:40:00Z", strategy: "Mean Reversion", notes: "3 MNQ ($2/pt). Faded the gap too early, squeezed out above the open." },
  { symbol: "ES", direction: "LONG", entryPrice: 6895, exitPrice: 6907.75, size: 50, fees: 9.0, entryDate: "2026-04-29T13:45:00Z", exitDate: "2026-04-30T18:30:00Z", strategy: "Trend Follow", notes: "1 ES ($50/pt). Overnight swing with the daily trend, trailed under 20 EMA." },
  { symbol: "MGC", direction: "LONG", entryPrice: 4212.4, exitPrice: 4198.7, size: 20, fees: 5.0, entryDate: "2026-04-30T14:20:00Z", exitDate: "2026-04-30T17:05:00Z", strategy: "Pullback", notes: "2 MGC ($10/pt). Gold pullback buy failed when dollar spiked. Cut it." },
  { symbol: "CL", direction: "SHORT", entryPrice: 68.42, exitPrice: 67.55, size: 1000, fees: 5.0, entryDate: "2026-05-01T14:40:00Z", exitDate: "2026-05-01T19:20:00Z", strategy: "News", notes: "1 CL ($1,000/$1). Shorted the inventory-report pop, covered into the close." },
  { symbol: "MES", direction: "SHORT", entryPrice: 7010.5, exitPrice: 6994.25, size: 15, fees: 7.5, entryDate: "2026-05-04T15:15:00Z", exitDate: "2026-05-04T18:45:00Z", strategy: "Breakout", notes: "3 MES. Range breakdown after three failed pushes at the high." },
  { symbol: "MNQ", direction: "LONG", entryPrice: 25310, exitPrice: 25398, size: 8, fees: 10.0, entryDate: "2026-05-05T13:50:00Z", exitDate: "2026-05-05T19:40:00Z", strategy: "Trend Follow", notes: "4 MNQ. Tech leadership day, added on the first pullback and held to the close." },
  { symbol: "MES", direction: "LONG", entryPrice: 7025, exitPrice: 7016.75, size: 10, fees: 5.0, entryDate: "2026-05-06T14:00:00Z", exitDate: "2026-05-06T14:50:00Z", strategy: "Pullback", notes: "2 MES. Support held but momentum died, scratched for -8 pts." },
  { symbol: "MGC", direction: "LONG", entryPrice: 4241.2, exitPrice: 4259.6, size: 30, fees: 7.5, entryDate: "2026-05-07T13:40:00Z", exitDate: "2026-05-07T18:15:00Z", strategy: "Breakout", notes: "3 MGC. Gold broke the weekly high on volume." },
  { symbol: "MES", direction: "SHORT", entryPrice: 7042, exitPrice: 7051.5, size: 10, fees: 5.0, entryDate: "2026-05-08T15:30:00Z", exitDate: "2026-05-08T16:10:00Z", strategy: "Mean Reversion", notes: "2 MES. Counter-trend short on a strong day. Bad idea, respected the stop." },
  { symbol: "MNQ", direction: "SHORT", entryPrice: 25490, exitPrice: 25402, size: 4, fees: 5.0, entryDate: "2026-05-11T17:30:00Z", exitDate: "2026-05-11T19:55:00Z", strategy: "Mean Reversion", notes: "2 MNQ. Extended 2.5 ATR above the mean into the afternoon, faded it back to VWAP." },
  { symbol: "ES", direction: "LONG", entryPrice: 7038, exitPrice: 7049.25, size: 50, fees: 9.0, entryDate: "2026-05-12T13:35:00Z", exitDate: "2026-05-12T15:20:00Z", strategy: "Opening Range", notes: "1 ES. Clean ORB with market breadth confirming." },
  { symbol: "MES", direction: "LONG", entryPrice: 7055, exitPrice: 7048.5, size: 20, fees: 10.0, entryDate: "2026-05-13T14:10:00Z", exitDate: "2026-05-13T14:45:00Z", strategy: "Breakout", notes: "4 MES. False break, no follow-through. -6.5 pts." },
  { symbol: "CL", direction: "LONG", entryPrice: 66.8, exitPrice: 66.35, size: 1000, fees: 5.0, entryDate: "2026-05-14T14:25:00Z", exitDate: "2026-05-14T17:50:00Z", strategy: "Trend Follow", notes: "1 CL. Tried to join the uptrend late, OPEC headline knocked it down." },
  { symbol: "MNQ", direction: "LONG", entryPrice: 25520, exitPrice: 25601, size: 6, fees: 7.5, entryDate: "2026-05-15T13:45:00Z", exitDate: "2026-05-15T19:50:00Z", strategy: "Pullback", notes: "3 MNQ. Bought the retest of yesterday's high — support/resistance flip." },
  { symbol: "MES", direction: "LONG", entryPrice: 7068.25, exitPrice: 7082, size: 15, fees: 7.5, entryDate: "2026-05-18T13:40:00Z", exitDate: "2026-05-18T16:30:00Z", strategy: "Opening Range", notes: "3 MES. ORB long on Monday strength." },
  { symbol: "MGC", direction: "SHORT", entryPrice: 4290, exitPrice: 4302.3, size: 20, fees: 5.0, entryDate: "2026-05-19T14:15:00Z", exitDate: "2026-05-19T15:05:00Z", strategy: "News", notes: "2 MGC. Shorted the Fed-minutes spike, got squeezed. News > levels." },
  { symbol: "MES", direction: "SHORT", entryPrice: 7095, exitPrice: 7079.75, size: 25, fees: 12.5, entryDate: "2026-05-20T14:35:00Z", exitDate: "2026-05-20T19:45:00Z", strategy: "Breakout", notes: "5 MES. Lower-high breakdown, best execution of the month — scaled out in thirds." },
  { symbol: "MNQ", direction: "LONG", entryPrice: 25630, exitPrice: 25668, size: 4, fees: 5.0, entryDate: "2026-05-21T15:00:00Z", exitDate: "2026-05-21T17:35:00Z", strategy: "Pullback", notes: "2 MNQ. Small size after yesterday's big day, banked +38 pts." },
  { symbol: "ES", direction: "SHORT", entryPrice: 7102, exitPrice: 7089.5, size: 50, fees: 9.0, entryDate: "2026-05-22T16:45:00Z", exitDate: "2026-05-22T19:50:00Z", strategy: "Mean Reversion", notes: "1 ES. Friday-afternoon fade from the weekly high into the close." },
  { symbol: "MES", direction: "LONG", entryPrice: 7110, exitPrice: 7104.75, size: 10, fees: 5.0, entryDate: "2026-05-26T14:05:00Z", exitDate: "2026-05-26T14:55:00Z", strategy: "Opening Range", notes: "2 MES. Choppy holiday-week open, scratched quickly." },
  { symbol: "CL", direction: "SHORT", entryPrice: 71.15, exitPrice: 70.42, size: 1000, fees: 5.0, entryDate: "2026-05-27T14:35:00Z", exitDate: "2026-05-27T18:20:00Z", strategy: "News", notes: "1 CL. Inventory build bigger than expected, rode the flush." },
  { symbol: "MNQ", direction: "SHORT", entryPrice: 25780, exitPrice: 25842, size: 6, fees: 7.5, entryDate: "2026-05-28T15:20:00Z", exitDate: "2026-05-28T16:05:00Z", strategy: "Mean Reversion", notes: "3 MNQ. Faded strength on an AI-headline day. Wrong side, cut fast." },
  { symbol: "MES", direction: "LONG", entryPrice: 7118.5, exitPrice: 7136.25, size: 15, fees: 7.5, entryDate: "2026-05-29T13:50:00Z", exitDate: "2026-05-29T19:55:00Z", strategy: "Trend Follow", notes: "3 MES. Month-end markup, held the runner to the close." },
  { symbol: "MGC", direction: "LONG", entryPrice: 4318.6, exitPrice: 4337.2, size: 20, fees: 5.0, entryDate: "2026-06-01T13:40:00Z", exitDate: "2026-06-01T18:40:00Z", strategy: "Breakout", notes: "2 MGC. Gold all-time-high break, textbook continuation." },
  { symbol: "MES", direction: "SHORT", entryPrice: 7150, exitPrice: 7159.25, size: 10, fees: 5.0, entryDate: "2026-06-02T14:20:00Z", exitDate: "2026-06-02T15:00:00Z", strategy: "Pullback", notes: "2 MES. Shorted a pullback in an uptrend — fighting the tape again." },
  { symbol: "MNQ", direction: "LONG", entryPrice: 25890, exitPrice: 25972, size: 8, fees: 10.0, entryDate: "2026-06-03T13:35:00Z", exitDate: "2026-06-03T17:25:00Z", strategy: "Opening Range", notes: "4 MNQ. ORB with NQ leading ES all morning." },
  { symbol: "ES", direction: "LONG", entryPrice: 7141, exitPrice: 7127.75, size: 50, fees: 9.0, entryDate: "2026-06-05T13:45:00Z", exitDate: "2026-06-05T15:30:00Z", strategy: "Trend Follow", notes: "1 ES. NFP whipsaw took the stop. Should have halved size into the number." },
  { symbol: "MES", direction: "LONG", entryPrice: 7133, exitPrice: 7151.5, size: 20, fees: 10.0, entryDate: "2026-06-16T13:40:00Z", exitDate: "2026-06-16T19:35:00Z", strategy: "Breakout", notes: "4 MES. Coiled range resolved higher after two inside days." },
  { symbol: "CL", direction: "LONG", entryPrice: 69.2, exitPrice: 70.05, size: 1000, fees: 5.0, entryDate: "2026-06-23T14:10:00Z", exitDate: "2026-06-24T17:45:00Z", strategy: "Trend Follow", notes: "1 CL. Two-day hold with the new uptrend, exited at the measured move." },
];

const journalEntries = [
  { date: "2026-05-20", mood: 4, discipline: 5, notes: "Waited all morning for the MES lower-high to confirm before pressing the short. Scaled out in thirds like the plan said.", lessons: "The best trades come from waiting for the setup to come to me, not chasing the first move." },
  { date: "2026-05-26", mood: 2, discipline: 3, notes: "Holiday-week chop. Scratched the ORB fast — at least the loss was small this time.", lessons: "Half size on low-volume weeks. The ranges just aren't there." },
  { date: "2026-06-05", mood: 2, discipline: 2, notes: "Held a full ES through NFP like it was a normal morning. Stopped out on the whipsaw within minutes.", lessons: "No full-size positions into tier-1 data. Flat or half size, no exceptions." },
  { date: "2026-06-16", mood: 5, discipline: 5, notes: "Two inside days on MES, set the alert, took the break exactly at the level and let the runner work.", lessons: "Planning the trade the night before removes all the hesitation at the trigger." },
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

  await prisma.trade.deleteMany({ where: { userId: demo.id, source: "seed" } });

  for (const t of trades) {
    await prisma.trade.create({
      data: {
        ...t,
        entryDate: new Date(t.entryDate),
        exitDate: new Date(t.exitDate),
        source: "seed",
        userId: demo.id,
      },
    });
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
