import { prisma } from "./prisma";

/**
 * "Red folder" news: high-impact events from ForexFactory's free weekly JSON
 * feeds, accumulated in the NewsEvent table so past months keep their icons.
 * Refresh is best-effort with a short timeout — the calendar renders fine from
 * whatever is already stored when the feed is unreachable.
 */

const FEEDS = ["lastweek", "thisweek", "nextweek"].map(
  (w) => `https://nfs.faireconomy.media/ff_calendar_${w}.json`,
);

type FfItem = { title?: string; country?: string; date?: string; impact?: string };

// Per-instance guard so serverless doesn't hit the feed on every page view.
let lastRefresh = 0;
const REFRESH_MS = 6 * 60 * 60 * 1000;

export async function refreshNews(): Promise<void> {
  if (Date.now() - lastRefresh < REFRESH_MS) return;
  lastRefresh = Date.now();

  for (const url of FEEDS) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const items = (await res.json()) as FfItem[];
      for (const item of items) {
        if (item.impact !== "High" || !item.title || !item.date) continue;
        // Feed timestamps are ISO with the ET offset, e.g. "2026-07-08T08:30:00-04:00" —
        // the leading date/time substrings ARE New York local time.
        const date = item.date.slice(0, 10);
        const time = item.date.slice(11, 16);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
        await prisma.newsEvent
          .upsert({
            where: { date_time_title: { date, time, title: item.title } },
            update: {},
            create: { date, time, title: item.title, currency: item.country ?? "?", impact: "High" },
          })
          .catch(() => null);
      }
    } catch (e) {
      console.error(`news refresh failed for ${url}:`, e instanceof Error ? e.message : e);
    }
  }
}

export type DayNews = { time: string; title: string; currency: string }[];

/** Red-folder events for one "YYYY-MM" month, keyed by "YYYY-MM-DD". */
export async function newsByDay(monthPrefix: string): Promise<Map<string, DayNews>> {
  const rows = await prisma.newsEvent.findMany({
    where: { date: { startsWith: monthPrefix } },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    select: { date: true, time: true, title: true, currency: true },
  });
  const map = new Map<string, DayNews>();
  for (const r of rows) {
    const arr = map.get(r.date) ?? [];
    arr.push({ time: r.time, title: r.title, currency: r.currency });
    map.set(r.date, arr);
  }
  return map;
}
