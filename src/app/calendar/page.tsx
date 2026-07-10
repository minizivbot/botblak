import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { closedTrades, type StatsTrade } from "@/lib/stats";
import { refreshNews, newsByDay } from "@/lib/news";
import { fmtSignedMoney } from "@/lib/format";
import { DemoBanner } from "@/components/DemoBanner";
import { CalendarGrid, type DayDetail, type DayNewsLite } from "@/components/CalendarGrid";

export const dynamic = "force-dynamic";
export const metadata = { title: "Calendar" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await getViewer();
  if (!viewer.userId) redirect("/login");

  // Month from ?m=YYYY-MM, defaulting to the current New York month.
  const params = await searchParams;
  const nyToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const requested = typeof params.m === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(params.m) ? params.m : nyToday.slice(0, 7);
  const [year, month] = [Number(requested.slice(0, 4)), Number(requested.slice(5, 7))];

  const monthLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const prev = `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, "0")}`;
  const next = `${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, "0")}`;

  // Pull the red-folder feed (no-op when fresh/unreachable), then this month's data.
  await refreshNews();
  const [news, tradesRaw, accounts, settings] = await Promise.all([
    newsByDay(requested),
    prisma.trade.findMany({ where: { userId: viewer.userId } }),
    prisma.account.findMany({ where: { userId: viewer.userId }, select: { id: true, name: true } }),
    prisma.settings.findUnique({ where: { userId: viewer.userId }, select: { currency: true } }),
  ]);
  const currency = settings?.currency ?? "USD";
  const nameOf = new Map(accounts.map((a) => [a.id, a.name]));
  const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false });

  // Rich per-day breakdown, keyed "YYYY-MM-DD" by (UTC) close date. Trades are
  // chronological within the day; account totals ride alongside.
  const days: Record<string, DayDetail> = {};
  for (const t of closedTrades(tradesRaw as StatsTrade[])) {
    const key = t.closedAt.toISOString().slice(0, 10);
    if (!key.startsWith(requested)) continue;
    const accountId = (t as { accountId?: string | null }).accountId ?? null;
    const account = accountId ? nameOf.get(accountId) ?? null : null;
    const d = (days[key] ??= { pnl: 0, count: 0, wins: 0, trades: [], accounts: [] });
    d.pnl += t.pnl;
    d.count += 1;
    if (t.pnl > 0) d.wins += 1;
    d.trades.push({ symbol: t.symbol, direction: t.direction, pnl: t.pnl, account, time: timeFmt.format(t.closedAt) });
    const acctName = account ?? "No account";
    const agg = d.accounts.find((a) => a.name === acctName);
    if (agg) {
      agg.pnl += t.pnl;
      agg.count += 1;
    } else {
      d.accounts.push({ name: acctName, pnl: t.pnl, count: 1 });
    }
  }

  // Serialize the news Map to a plain object for the client grid.
  const newsLite: Record<string, DayNewsLite[]> = {};
  for (const [k, evts] of news) {
    newsLite[k] = evts.map((e) => ({ time: e.time, currency: e.currency, title: e.title }));
  }

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0 = Sunday

  // Build week rows of 7 cells (day number or null padding).
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const detailList = Object.values(days);
  const monthTotal = detailList.reduce((s, d) => s + d.pnl, 0);
  const greenDays = detailList.filter((d) => d.pnl > 0).length;
  const redDays = detailList.filter((d) => d.pnl < 0).length;

  return (
    <div className="space-y-4">
      {viewer.isDemo && <DemoBanner />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Calendar</h1>
          <p className="text-xs text-muted">
            Daily P&L at a glance · <span className="text-loss">📕→</span> red folder = high-impact news day
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link href={`/calendar?m=${prev}`} aria-label="Previous month" className="rounded-lg border border-edge px-2.5 py-1.5 text-sm text-ink-2 hover:bg-raised">
            ←
          </Link>
          <span className="min-w-36 px-2 text-center text-sm font-semibold">{monthLabel}</span>
          <Link href={`/calendar?m=${next}`} aria-label="Next month" className="rounded-lg border border-edge px-2.5 py-1.5 text-sm text-ink-2 hover:bg-raised">
            →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card">
          <p className="text-xs text-muted">Month P&L</p>
          <p className={`text-xl font-bold ${monthTotal > 0 ? "text-profit" : monthTotal < 0 ? "text-loss" : ""}`}>
            {fmtSignedMoney(monthTotal, currency)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-muted">Green days</p>
          <p className="text-xl font-bold text-profit">{greenDays}</p>
        </div>
        <div className="card">
          <p className="text-xs text-muted">Red days</p>
          <p className="text-xl font-bold text-loss">{redDays}</p>
        </div>
      </div>

      <CalendarGrid
        month={requested}
        currency={currency}
        weeks={weeks}
        days={days}
        news={newsLite}
        nyToday={nyToday}
      />

      <p className="text-[11px] text-muted">
        Tap any day with trades to see its full breakdown and download a shareable P&L image. Red-folder events come
        from the ForexFactory economic calendar (high impact only) and refresh automatically a few times a day.
      </p>
    </div>
  );
}
