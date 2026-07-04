import type { Prisma } from "@prisma/client";
import { KILLZONES, killzone, type Killzone } from "./killzones";

export type TradeFilters = {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  symbol?: string;
  strategy?: string;
  direction?: "LONG" | "SHORT";
  killzone?: Killzone;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseFilters(params: Record<string, string | string[] | undefined>): TradeFilters {
  const get = (k: string) => {
    const v = params[k];
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };
  const from = get("from");
  const to = get("to");
  const direction = get("direction")?.toUpperCase();
  const kz = get("killzone");
  return {
    from: from && DATE_RE.test(from) ? from : undefined,
    to: to && DATE_RE.test(to) ? to : undefined,
    symbol: get("symbol")?.toUpperCase(),
    strategy: get("strategy"),
    direction: direction === "LONG" || direction === "SHORT" ? direction : undefined,
    killzone: kz && (KILLZONES as readonly string[]).includes(kz) ? (kz as Killzone) : undefined,
  };
}

/** Killzone is computed from entryDate, so it filters in memory after the query. */
export function applyKillzoneFilter<T extends { entryDate: Date }>(trades: T[], f: TradeFilters): T[] {
  if (!f.killzone) return trades;
  return trades.filter((t) => killzone(t.entryDate) === f.killzone);
}

export function filtersToWhere(f: TradeFilters): Prisma.TradeWhereInput {
  const where: Prisma.TradeWhereInput = {};
  if (f.symbol) where.symbol = f.symbol;
  if (f.strategy) where.strategy = f.strategy;
  if (f.direction) where.direction = f.direction;
  if (f.from || f.to) {
    where.entryDate = {};
    if (f.from) where.entryDate.gte = new Date(`${f.from}T00:00:00.000Z`);
    if (f.to) where.entryDate.lte = new Date(`${f.to}T23:59:59.999Z`);
  }
  return where;
}
