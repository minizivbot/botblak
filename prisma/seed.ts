import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedTrade = {
  symbol: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number;
  size: number;
  fees: number;
  entryDate: string; // ISO
  exitDate: string; // ISO
  strategy: string;
  notes: string;
};

// 30 realistic trades spread over the ~10 weeks before the seed date.
const trades: SeedTrade[] = [
  { symbol: "AAPL", direction: "LONG", entryPrice: 196.4, exitPrice: 199.85, size: 50, fees: 1.0, entryDate: "2026-04-27T13:35:00Z", exitDate: "2026-04-27T15:10:00Z", strategy: "Breakout", notes: "Broke above pre-market high on volume. Took profit at prior resistance." },
  { symbol: "TSLA", direction: "SHORT", entryPrice: 292.1, exitPrice: 297.4, size: 20, fees: 1.2, entryDate: "2026-04-28T14:05:00Z", exitDate: "2026-04-28T14:40:00Z", strategy: "Mean Reversion", notes: "Faded the gap up too early, stopped out above VWAP." },
  { symbol: "NVDA", direction: "LONG", entryPrice: 152.3, exitPrice: 158.9, size: 60, fees: 1.5, entryDate: "2026-04-29T13:45:00Z", exitDate: "2026-04-30T18:30:00Z", strategy: "Trend Follow", notes: "Held overnight into earnings drift. Trailed stop under 20 EMA." },
  { symbol: "SPY", direction: "LONG", entryPrice: 592.5, exitPrice: 590.1, size: 30, fees: 0.9, entryDate: "2026-05-01T15:20:00Z", exitDate: "2026-05-01T17:05:00Z", strategy: "Pullback", notes: "Bought the dip at the 50 SMA but breadth was weak. Cut it." },
  { symbol: "AMD", direction: "LONG", entryPrice: 118.7, exitPrice: 123.35, size: 80, fees: 1.4, entryDate: "2026-05-04T13:40:00Z", exitDate: "2026-05-04T19:45:00Z", strategy: "Breakout", notes: "Cup-and-handle break on the daily. Scaled out in two pieces." },
  { symbol: "MSFT", direction: "LONG", entryPrice: 449.2, exitPrice: 452.05, size: 25, fees: 1.0, entryDate: "2026-05-05T14:15:00Z", exitDate: "2026-05-05T16:50:00Z", strategy: "Pullback", notes: "First pullback to VWAP after strong open." },
  { symbol: "TSLA", direction: "LONG", entryPrice: 285.6, exitPrice: 281.2, size: 25, fees: 1.2, entryDate: "2026-05-06T14:00:00Z", exitDate: "2026-05-06T14:55:00Z", strategy: "Breakout", notes: "False breakout, no follow-through. Respected the stop." },
  { symbol: "META", direction: "LONG", entryPrice: 655.4, exitPrice: 668.8, size: 15, fees: 1.1, entryDate: "2026-05-07T13:50:00Z", exitDate: "2026-05-08T19:10:00Z", strategy: "Trend Follow", notes: "Rode the post-earnings momentum for a second day." },
  { symbol: "QQQ", direction: "SHORT", entryPrice: 512.8, exitPrice: 508.15, size: 40, fees: 1.3, entryDate: "2026-05-11T17:30:00Z", exitDate: "2026-05-11T19:55:00Z", strategy: "Mean Reversion", notes: "Extended 2.5 ATR above the mean into the close. Covered near VWAP." },
  { symbol: "NVDA", direction: "LONG", entryPrice: 160.1, exitPrice: 159.05, size: 50, fees: 1.5, entryDate: "2026-05-12T14:10:00Z", exitDate: "2026-05-12T15:00:00Z", strategy: "Pullback", notes: "Choppy day, small loss. Should have waited for the afternoon setup." },
  { symbol: "AAPL", direction: "SHORT", entryPrice: 204.9, exitPrice: 201.3, size: 45, fees: 1.0, entryDate: "2026-05-13T15:40:00Z", exitDate: "2026-05-13T19:30:00Z", strategy: "Mean Reversion", notes: "Rejected at weekly resistance twice. Clean fade." },
  { symbol: "COIN", direction: "LONG", entryPrice: 242.5, exitPrice: 259.7, size: 30, fees: 1.6, entryDate: "2026-05-14T13:35:00Z", exitDate: "2026-05-15T18:20:00Z", strategy: "News", notes: "Bought the regulatory news pop, added on the first pullback." },
  { symbol: "SPY", direction: "LONG", entryPrice: 596.2, exitPrice: 598.9, size: 35, fees: 0.9, entryDate: "2026-05-18T14:25:00Z", exitDate: "2026-05-18T19:50:00Z", strategy: "Trend Follow", notes: "Slow grind day, held to the close." },
  { symbol: "AMZN", direction: "LONG", entryPrice: 212.4, exitPrice: 209.85, size: 50, fees: 1.2, entryDate: "2026-05-19T14:00:00Z", exitDate: "2026-05-19T16:10:00Z", strategy: "Breakout", notes: "Breakout failed when the market rolled over. -1R." },
  { symbol: "TSLA", direction: "SHORT", entryPrice: 301.8, exitPrice: 289.95, size: 22, fees: 1.2, entryDate: "2026-05-20T14:35:00Z", exitDate: "2026-05-21T17:45:00Z", strategy: "Trend Follow", notes: "Lower-high on the daily after the downgrade. Best trade of the month." },
  { symbol: "GOOGL", direction: "LONG", entryPrice: 178.9, exitPrice: 181.55, size: 55, fees: 1.1, entryDate: "2026-05-22T13:55:00Z", exitDate: "2026-05-22T19:40:00Z", strategy: "Pullback", notes: "Bounce off the rising 21 EMA." },
  { symbol: "NVDA", direction: "SHORT", entryPrice: 166.8, exitPrice: 169.6, size: 40, fees: 1.5, entryDate: "2026-05-26T15:15:00Z", exitDate: "2026-05-26T16:00:00Z", strategy: "Mean Reversion", notes: "Tried to fade strength on a strong day. Bad idea, cut fast." },
  { symbol: "MSFT", direction: "LONG", entryPrice: 458.6, exitPrice: 465.2, size: 30, fees: 1.0, entryDate: "2026-05-27T13:45:00Z", exitDate: "2026-05-28T18:35:00Z", strategy: "Breakout", notes: "All-time-high breakout, held a partial overnight." },
  { symbol: "QQQ", direction: "LONG", entryPrice: 518.4, exitPrice: 521.05, size: 45, fees: 1.3, entryDate: "2026-05-29T14:20:00Z", exitDate: "2026-05-29T19:55:00Z", strategy: "Trend Follow", notes: "Month-end markup, rode the afternoon trend." },
  { symbol: "AMD", direction: "SHORT", entryPrice: 127.9, exitPrice: 125.1, size: 70, fees: 1.4, entryDate: "2026-06-02T15:00:00Z", exitDate: "2026-06-02T18:25:00Z", strategy: "Mean Reversion", notes: "Faded the open drive after three green days." },
  { symbol: "AAPL", direction: "LONG", entryPrice: 207.3, exitPrice: 213.4, size: 55, fees: 1.0, entryDate: "2026-06-03T13:40:00Z", exitDate: "2026-06-04T19:15:00Z", strategy: "Trend Follow", notes: "WWDC anticipation swing. Exited into the event pop." },
  { symbol: "COIN", direction: "SHORT", entryPrice: 268.4, exitPrice: 274.9, size: 25, fees: 1.6, entryDate: "2026-06-05T14:10:00Z", exitDate: "2026-06-05T15:05:00Z", strategy: "News", notes: "Shorted the pop, got squeezed. Sized too big for the volatility." },
  { symbol: "SPY", direction: "SHORT", entryPrice: 601.7, exitPrice: 598.35, size: 40, fees: 0.9, entryDate: "2026-06-08T16:45:00Z", exitDate: "2026-06-08T19:50:00Z", strategy: "Mean Reversion", notes: "CPI-eve drift lower, covered before the close." },
  { symbol: "META", direction: "LONG", entryPrice: 672.1, exitPrice: 684.55, size: 18, fees: 1.1, entryDate: "2026-06-09T13:50:00Z", exitDate: "2026-06-10T18:40:00Z", strategy: "Breakout", notes: "Flag break above 670. Textbook follow-through day two." },
  { symbol: "TSLA", direction: "LONG", entryPrice: 295.2, exitPrice: 293.75, size: 25, fees: 1.2, entryDate: "2026-06-11T14:05:00Z", exitDate: "2026-06-11T15:20:00Z", strategy: "Pullback", notes: "Support held but momentum died. Scratched it." },
  { symbol: "NVDA", direction: "LONG", entryPrice: 171.5, exitPrice: 178.2, size: 65, fees: 1.5, entryDate: "2026-06-15T13:35:00Z", exitDate: "2026-06-17T19:45:00Z", strategy: "Trend Follow", notes: "Three-day swing into the conference keynote." },
  { symbol: "GOOGL", direction: "SHORT", entryPrice: 184.6, exitPrice: 186.85, size: 45, fees: 1.1, entryDate: "2026-06-18T14:30:00Z", exitDate: "2026-06-18T16:15:00Z", strategy: "Mean Reversion", notes: "Fade failed on antitrust headline. News > technicals." },
  { symbol: "AMZN", direction: "LONG", entryPrice: 218.9, exitPrice: 224.3, size: 50, fees: 1.2, entryDate: "2026-06-22T13:45:00Z", exitDate: "2026-06-23T18:55:00Z", strategy: "Breakout", notes: "Range break after two weeks of consolidation." },
  { symbol: "QQQ", direction: "LONG", entryPrice: 527.8, exitPrice: 531.15, size: 40, fees: 1.3, entryDate: "2026-06-25T14:15:00Z", exitDate: "2026-06-25T19:50:00Z", strategy: "Pullback", notes: "Morning dip bought at yesterday's high — support/resistance flip." },
  { symbol: "AAPL", direction: "LONG", entryPrice: 215.8, exitPrice: 214.2, size: 40, fees: 1.0, entryDate: "2026-06-29T14:00:00Z", exitDate: "2026-06-29T17:35:00Z", strategy: "Breakout", notes: "Quarter-end chop, breakout never followed through." },
];

const journalEntries = [
  { date: "2026-05-20", mood: 4, discipline: 5, notes: "Patient all morning, waited for the TSLA lower-high to confirm before shorting.", lessons: "The best trades come from waiting for the setup to come to me, not chasing." },
  { date: "2026-05-26", mood: 2, discipline: 2, notes: "Faded NVDA strength out of boredom. Knew it was a bad idea when I clicked.", lessons: "No counter-trend trades on trend days. Write the plan before the open and stick to it." },
  { date: "2026-06-05", mood: 2, discipline: 3, notes: "COIN short was double my normal size because I felt confident. Got squeezed immediately.", lessons: "Confidence is not a position-sizing signal. Volatile names get half size, not double." },
  { date: "2026-06-15", mood: 5, discipline: 5, notes: "Followed the swing plan on NVDA exactly: starter, add on confirmation, trail the stop.", lessons: "Scaling in on confirmation keeps the risk small when I'm wrong and the size big when I'm right." },
];

async function main() {
  await prisma.trade.deleteMany({ where: { source: "seed" } });

  for (const t of trades) {
    await prisma.trade.create({
      data: {
        ...t,
        entryDate: new Date(t.entryDate),
        exitDate: new Date(t.exitDate),
        source: "seed",
      },
    });
  }

  for (const j of journalEntries) {
    await prisma.journalEntry.upsert({
      where: { date: j.date },
      update: j,
      create: j,
    });
  }

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, startingBalance: 25000, currency: "USD" },
  });

  console.log(`Seeded ${trades.length} trades, ${journalEntries.length} journal entries, and default settings.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
