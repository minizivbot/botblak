const ET_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "YYYY-MM-DD" New York date for a given instant (defaults to now). */
export function etDateOf(d: Date = new Date()): string {
  return ET_DATE.format(d);
}

/** "YYYY-MM-DD" for the current New York date (the trading day). */
export function etToday(now: Date = new Date()): string {
  return ET_DATE.format(now);
}
