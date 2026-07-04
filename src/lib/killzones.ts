/**
 * ICT killzones, derived from a trade's entry time in New York time (ET).
 * No schema change needed — the zone is computed from entryDate on the fly.
 */

export const KILLZONES = [
  "Asia KZ",
  "London KZ",
  "NY AM KZ",
  "London Close KZ",
  "NY PM KZ",
  "Off-hours",
] as const;

export type Killzone = (typeof KILLZONES)[number];

/** Fractional hour-of-day in America/New_York for a given instant. */
function etHour(d: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h + m / 60;
}

/**
 * ICT killzone windows (ET):
 *   Asia 20:00–00:00 · London 02:00–05:00 · NY AM 07:00–10:00 ·
 *   London Close 10:00–12:00 · NY PM 13:30–16:00 — everything else Off-hours.
 */
export function killzone(d: Date | string): Killzone {
  const h = etHour(typeof d === "string" ? new Date(d) : d);
  if (h >= 20) return "Asia KZ";
  if (h >= 2 && h < 5) return "London KZ";
  if (h >= 7 && h < 10) return "NY AM KZ";
  if (h >= 10 && h < 12) return "London Close KZ";
  if (h >= 13.5 && h < 16) return "NY PM KZ";
  return "Off-hours";
}

/** ICT concepts a trader can tag on a trade (plus free-text custom ones). */
export const ICT_CONCEPTS = [
  "FVG",
  "Inverse FVG",
  "Order Block",
  "Breaker",
  "BPR",
  "Liquidity Sweep",
  "Equal Highs/Lows",
  "MSS",
  "BOS",
  "SMT Divergence",
  "OTE",
  "Premium/Discount",
  "Turtle Soup",
  "Draw on Liquidity",
  "NWOG/NDOG",
];

export const ICT_SETUPS = [
  "Silver Bullet",
  "Judas Swing",
  "FVG",
  "Order Block",
  "Breaker",
  "Liquidity Sweep",
  "SMT Divergence",
  "OTE",
  "Power of 3",
];
