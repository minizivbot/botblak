import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { closedTrades, type StatsTrade } from "@/lib/stats";
import { refreshNews, newsByDay, type DayNews } from "@/lib/news";
import { fmtSignedMoney } from "@/lib/format";
import { DemoBanner } from "@/components/DemoBanner";

export const dynamic = "force-dynamic";
export const metadata = { title: "Calendar" };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "$1.2K" style compact money for tight calendar cells. */
function compact(n: number): string {
  const abs = Math.abs(n);
  const s = abs >= 10000 ? `${(abs / 1000).toFixed(0)}K` : abs >= 1000 ? `${(abs / 1000).toFixed(1)}K` : abs.toFixed(0);
  return `${n < 0 ? "-" : "+"}$${s}`;
}

function RedFolder({ events }: { events: DayNews }) {
  const label = events.map((e) => `${e.time ? e.time + " " : ""}${e.currency} — ${e.title}`).join("\n");
  return (
    <span title={label} className="inline-flex items-center" aria-label="High-impact news">
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
        <path
          d="M1.5 3.5A1.5 1.5 0 013 2h3l1.5 1.8H13A1.5 1.5 0 0114.5 5.3v7.2A1.5 1.5 0 0113 14H3a1.5 1.5 0 01-1.5-1.5v-9z"
          fill="#ef4444"
        />
      </svg>
      {events.length > 1 && <span className="ml-0.5 text-[9px] font-bold text-loss">{events.length}</span>}
    </span>
  );
}

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
  const [news, tradesRaw] = await Promise.all([
    newsByDay(requested),
    prisma.trade.findMany({ where: { userId: viewer.userId } }),
  ]);

  // Daily net P&L + counts, keyed "YYYY-MM-DD" by close date.
  const days = new Map<string, { pnl: number; count: number }>();
  for (const t of closedTrades(tradesRaw as StatsTrade[])) {
    const key = t.closedAt.toISOString().slice(0, 10);
    if (!key.startsWith(requested)) continue;
    const d = days.get(key) ?? { pnl: 0, count: 0 };
    d.pnl += t.pnl;
    d.count += 1;
    days.set(key, d);
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

  const key = (d: number) => `${requested}-${String(d).padStart(2, "0")}`;
  const monthTotal = [...days.values()].reduce((s, d) => s + d.pnl, 0);
  const greenDays = [...days.values()].filter((d) => d.pnl > 0).length;
  const redDays = [...days.values()].filter((d) => d.pnl < 0).length;
  const isToday = (d: number) => key(d) === nyToday;

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
            {fmtSignedMoney(monthTotal)}
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

      <div className="card overflow-x-auto p-2 sm:p-3">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[repeat(7,1fr)_5rem] gap-1.5 pb-1.5 text-center text-[11px] font-semibold text-muted">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
            <span>Week</span>
          </div>
          <div className="space-y-1.5">
            {weeks.map((week, wi) => {
              const weekTotal = week.reduce((s: number, d) => s + (d ? (days.get(key(d))?.pnl ?? 0) : 0), 0);
              const weekHasTrades = week.some((d) => d && days.has(key(d)));
              return (
                <div key={wi} className="grid grid-cols-[repeat(7,1fr)_5rem] gap-1.5">
                  {week.map((d, di) => {
                    if (d == null) return <div key={di} className="min-h-16 rounded-lg" />;
                    const data = days.get(key(d));
                    const events = news.get(key(d));
                    const toneCls = !data
                      ? "border-edge bg-raised/20"
                      : data.pnl > 0
                        ? "border-profit/40 bg-profit/10"
                        : data.pnl < 0
                          ? "border-loss/40 bg-loss/10"
                          : "border-edge bg-raised/40";
                    return (
                      <div
                        key={di}
                        className={`min-h-16 rounded-lg border px-1.5 py-1 ${toneCls} ${isToday(d) ? "ring-1 ring-accent" : ""}`}
                      >
                        <div className="flex items-start justify-between">
                          <span className={`text-[11px] ${isToday(d) ? "font-bold text-accent" : "text-muted"}`}>{d}</span>
                          {events && <RedFolder events={events} />}
                        </div>
                        {data && (
                          <>
                            <p className={`text-xs font-bold tabular-nums ${data.pnl > 0 ? "text-profit" : data.pnl < 0 ? "text-loss" : "text-ink-2"}`}>
                              {compact(data.pnl)}
                            </p>
                            <p className="text-[10px] text-muted">
                              {data.count} trade{data.count === 1 ? "" : "s"}
                            </p>
                          </>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex min-h-16 flex-col items-center justify-center rounded-lg border border-edge bg-raised/30 px-1">
                    {weekHasTrades ? (
                      <p className={`text-xs font-bold tabular-nums ${weekTotal > 0 ? "text-profit" : weekTotal < 0 ? "text-loss" : "text-ink-2"}`}>
                        {compact(weekTotal)}
                      </p>
                    ) : (
                      <span className="text-[10px] text-muted">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted">
        Red-folder events come from the ForexFactory economic calendar (high impact only) and refresh automatically a
        few times a day. Times shown in the tooltip are New York time.
      </p>
    </div>
  );
}
