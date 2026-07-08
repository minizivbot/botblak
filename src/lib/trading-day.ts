/** Helpers for "today" in the New York trading day sense. */

const ET_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "YYYY-MM-DD" for the current New York date. */
export function etToday(now: Date = new Date()): string {
  return ET_DATE.format(now);
}

/** The UTC instant when the current New York date started (ET midnight). */
export function etMidnightUtc(now: Date = new Date()): Date {
  const offset = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "longOffset",
  })
    .formatToParts(now)
    .find((p) => p.type === "timeZoneName")?.value; // e.g. "GMT-04:00"
  const iso = `${etToday(now)}T00:00:00${(offset ?? "GMT-05:00").replace("GMT", "")}`;
  return new Date(iso);
}
