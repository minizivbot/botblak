import { NextRequest, NextResponse } from "next/server";
import { refreshNews, newsByDay } from "@/lib/news";
import { sendPushToAll } from "@/lib/push";
import { etToday } from "@/lib/trading-day";
import { isCronCall } from "@/lib/cron";

/**
 * Weekday-morning briefing (Vercel cron, ~7:00 New York): if today has
 * red-folder events, push the schedule to every subscribed user. Quiet days
 * send nothing — the notification only ever means "check the calendar".
 */
export async function GET(req: NextRequest) {
  if (!isCronCall(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await refreshNews();
  const today = etToday();
  const events = (await newsByDay(today.slice(0, 7))).get(today) ?? [];
  if (events.length === 0) return NextResponse.json({ sent: false, reason: "no red folders today" });

  const usd = events.filter((e) => e.currency === "USD");
  const list = (usd.length > 0 ? usd : events)
    .slice(0, 3)
    .map((e) => `${e.title} ${e.time}`)
    .join(" · ");
  const extra = events.length > 3 ? ` +${events.length - 3} more` : "";

  await sendPushToAll({
    title: `📕 ${events.length} red folder${events.length === 1 ? "" : "s"} today`,
    body: `${list}${extra} (NY time). Plan around the news — not through it.`,
    url: "/calendar",
  });
  return NextResponse.json({ sent: true, events: events.length });
}
