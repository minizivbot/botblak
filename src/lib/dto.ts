import type { Trade } from "@prisma/client";

type TradeWithAccount = Trade & { account?: { name: string; isCopy: boolean } | null };

/** JSON-safe trade shape passed from server components to client components. */
export type TradeDTO = {
  id: string;
  accountId: string | null;
  accountName: string | null;
  accountIsCopy: boolean;
  symbol: string;
  direction: string;
  entryPrice: number;
  exitPrice: number | null;
  size: number;
  fees: number;
  entryDate: string;
  exitDate: string | null;
  strategy: string | null;
  concepts: string | null;
  notes: string | null;
  screenshotPath: string | null;
  source: string;
};

export function toTradeDTO(t: TradeWithAccount): TradeDTO {
  return {
    id: t.id,
    accountId: t.accountId,
    accountName: t.account?.name ?? null,
    accountIsCopy: t.account?.isCopy ?? false,
    symbol: t.symbol,
    direction: t.direction,
    entryPrice: t.entryPrice,
    exitPrice: t.exitPrice,
    size: t.size,
    fees: t.fees,
    entryDate: t.entryDate.toISOString(),
    exitDate: t.exitDate?.toISOString() ?? null,
    strategy: t.strategy,
    concepts: t.concepts,
    notes: t.notes,
    screenshotPath: t.screenshotPath,
    source: t.source,
  };
}
