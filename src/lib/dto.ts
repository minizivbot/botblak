import type { Trade } from "@prisma/client";

/** JSON-safe trade shape passed from server components to client components. */
export type TradeDTO = {
  id: string;
  symbol: string;
  direction: string;
  entryPrice: number;
  exitPrice: number | null;
  size: number;
  fees: number;
  entryDate: string;
  exitDate: string | null;
  strategy: string | null;
  notes: string | null;
  screenshotPath: string | null;
  source: string;
};

export function toTradeDTO(t: Trade): TradeDTO {
  return {
    id: t.id,
    symbol: t.symbol,
    direction: t.direction,
    entryPrice: t.entryPrice,
    exitPrice: t.exitPrice,
    size: t.size,
    fees: t.fees,
    entryDate: t.entryDate.toISOString(),
    exitDate: t.exitDate?.toISOString() ?? null,
    strategy: t.strategy,
    notes: t.notes,
    screenshotPath: t.screenshotPath,
    source: t.source,
  };
}
