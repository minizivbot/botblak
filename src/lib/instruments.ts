/**
 * Futures contract specs: dollars of P&L per 1.00 of price movement, per
 * contract. Used so users enter a plain contract count and the app computes
 * the stored size ( = contracts × dollarsPerPoint ), instead of doing that
 * multiplication in their head.
 *
 * Micros are 1/10 of their full-size parent — MES $5 vs ES $50, MNQ $2 vs
 * NQ $20 — which is exactly the case that was being scored wrong.
 */
export type Instrument = {
  symbol: string;
  name: string;
  dollarsPerPoint: number;
  tickSize?: number;
};

export const INSTRUMENTS: Instrument[] = [
  // Equity index
  { symbol: "ES", name: "S&P 500", dollarsPerPoint: 50, tickSize: 0.25 },
  { symbol: "MES", name: "Micro S&P 500", dollarsPerPoint: 5, tickSize: 0.25 },
  { symbol: "NQ", name: "Nasdaq 100", dollarsPerPoint: 20, tickSize: 0.25 },
  { symbol: "MNQ", name: "Micro Nasdaq 100", dollarsPerPoint: 2, tickSize: 0.25 },
  { symbol: "YM", name: "Dow", dollarsPerPoint: 5, tickSize: 1 },
  { symbol: "MYM", name: "Micro Dow", dollarsPerPoint: 0.5, tickSize: 1 },
  { symbol: "RTY", name: "Russell 2000", dollarsPerPoint: 50, tickSize: 0.1 },
  { symbol: "M2K", name: "Micro Russell 2000", dollarsPerPoint: 5, tickSize: 0.1 },
  // Metals
  { symbol: "GC", name: "Gold", dollarsPerPoint: 100, tickSize: 0.1 },
  { symbol: "MGC", name: "Micro Gold", dollarsPerPoint: 10, tickSize: 0.1 },
  { symbol: "SI", name: "Silver", dollarsPerPoint: 5000, tickSize: 0.005 },
  { symbol: "SIL", name: "Micro Silver", dollarsPerPoint: 1000, tickSize: 0.005 },
  // Energy
  { symbol: "CL", name: "Crude Oil", dollarsPerPoint: 1000, tickSize: 0.01 },
  { symbol: "MCL", name: "Micro Crude Oil", dollarsPerPoint: 100, tickSize: 0.01 },
  { symbol: "NG", name: "Natural Gas", dollarsPerPoint: 10000, tickSize: 0.001 },
  // FX
  { symbol: "6E", name: "Euro FX", dollarsPerPoint: 125000, tickSize: 0.00005 },
  { symbol: "6B", name: "British Pound", dollarsPerPoint: 62500, tickSize: 0.0001 },
  // Crypto (CME)
  { symbol: "MBT", name: "Micro Bitcoin", dollarsPerPoint: 0.1, tickSize: 5 },
  { symbol: "MET", name: "Micro Ether", dollarsPerPoint: 0.1, tickSize: 0.5 },
];

const BY_SYMBOL = new Map(INSTRUMENTS.map((i) => [i.symbol, i]));

/**
 * Look up an instrument by a user-typed symbol. Handles broker suffixes like
 * "MESU5", "ESZ2025", "MNQ.CME" by matching the longest known prefix so
 * "MES…" resolves to MES (not ES).
 */
export function findInstrument(raw: string): Instrument | undefined {
  const s = raw.trim().toUpperCase();
  if (!s) return undefined;
  if (BY_SYMBOL.has(s)) return BY_SYMBOL.get(s);
  // Longest symbol first so MES wins over ES, MNQ over NQ, etc.
  const byLen = [...INSTRUMENTS].sort((a, b) => b.symbol.length - a.symbol.length);
  return byLen.find((i) => s.startsWith(i.symbol));
}

/** Dollars-per-point for a symbol, or 1 (treat size as already-dollarized) when unknown. */
export function dollarsPerPoint(symbol: string): number {
  return findInstrument(symbol)?.dollarsPerPoint ?? 1;
}
