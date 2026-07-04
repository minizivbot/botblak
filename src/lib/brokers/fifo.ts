import type { NormalizedTrade } from "./types";

/** A single broker-agnostic fill (one executed order/partial). */
export type Fill = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  price: number;
  date: Date;
  /** Total fees charged on this fill (apportioned across matched trades). */
  fee?: number;
  /** Multiplier applied to qty when computing size (futures point value). */
  sizeMultiplier?: number;
  notes?: string;
};

type OpenLot = Fill & { direction: "LONG" | "SHORT"; remaining: number };

/**
 * Pair fills into round-trip trades, FIFO per symbol. A buy closes short lots
 * then opens longs; a sell closes long lots then opens shorts. Fees are
 * apportioned by matched quantity from both the opening and closing fill.
 * Unmatched remainders become open trades.
 */
export function pairFillsFifo(fills: Fill[], brokerId: string): NormalizedTrade[] {
  const lots = new Map<string, OpenLot[]>();
  const trades: NormalizedTrade[] = [];
  const sorted = [...fills]
    .filter((f) => Number.isFinite(f.qty) && f.qty > 0 && Number.isFinite(f.price))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  for (const f of sorted) {
    let qty = f.qty;
    const queue = lots.get(f.symbol) ?? [];
    lots.set(f.symbol, queue);
    const closes: "LONG" | "SHORT" = f.side === "sell" ? "LONG" : "SHORT";
    const opens: "LONG" | "SHORT" = f.side === "buy" ? "LONG" : "SHORT";
    const mult = f.sizeMultiplier ?? 1;

    while (qty > 0 && queue.length && queue[0].direction === closes) {
      const lot = queue[0];
      const matched = Math.min(qty, lot.remaining);
      const entryFee = ((lot.fee ?? 0) * matched) / lot.qty;
      const exitFee = ((f.fee ?? 0) * matched) / f.qty;
      trades.push({
        symbol: f.symbol,
        direction: lot.direction,
        entryPrice: lot.price,
        exitPrice: f.price,
        size: matched * (lot.sizeMultiplier ?? 1),
        fees: round2(entryFee + exitFee),
        entryDate: lot.date,
        exitDate: f.date,
        externalId: `${brokerId}:${lot.id}:${f.id}`,
        notes: lot.notes ?? f.notes,
      });
      lot.remaining -= matched;
      qty -= matched;
      if (lot.remaining <= 1e-9) queue.shift();
    }
    if (qty > 0) {
      queue.push({ ...f, qty, remaining: qty, direction: opens, sizeMultiplier: mult });
    }
  }

  for (const [symbol, queue] of lots) {
    for (const lot of queue) {
      trades.push({
        symbol,
        direction: lot.direction,
        entryPrice: lot.price,
        exitPrice: null,
        size: lot.remaining * (lot.sizeMultiplier ?? 1),
        fees: round2(((lot.fee ?? 0) * lot.remaining) / lot.qty),
        entryDate: lot.date,
        exitDate: null,
        externalId: `${brokerId}:${lot.id}:open`,
        notes: lot.notes,
      });
    }
  }

  return trades.sort((a, b) => a.entryDate.getTime() - b.entryDate.getTime());
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
