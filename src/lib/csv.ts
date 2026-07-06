/**
 * CSV import: column-mapping presets for MetaTrader 4/5 statements, Tradovate,
 * and a generic preset, plus the row -> trade converter used by the import page.
 */

import { dollarsPerPoint } from "./instruments";

export const TRADE_FIELDS = [
  "symbol",
  "direction",
  "entryPrice",
  "exitPrice",
  "size",
  "fees",
  "entryDate",
  "exitDate",
  "strategy",
  "notes",
  "externalId",
] as const;

export type TradeField = (typeof TRADE_FIELDS)[number];

export const FIELD_LABELS: Record<TradeField, string> = {
  symbol: "Symbol",
  direction: "Direction (buy/sell)",
  entryPrice: "Entry price",
  exitPrice: "Exit price",
  size: "Size / volume",
  fees: "Fees / commission",
  entryDate: "Entry date-time",
  exitDate: "Exit date-time",
  strategy: "Strategy tag",
  notes: "Notes / comment",
  externalId: "External id / ticket",
};

export const REQUIRED_FIELDS: TradeField[] = ["symbol", "direction", "entryPrice", "size", "entryDate"];

export type CsvPreset = {
  id: string;
  label: string;
  description: string;
  /** For each trade field, candidate header names (lowercased) in priority order. */
  headerCandidates: Partial<Record<TradeField, string[]>>;
  /**
   * Optional per-row rewrite applied before mapping — for broker exports whose
   * columns don't line up one-to-one with a trade (e.g. Tradovate's buy/sell
   * round-trip format). Returns a row keyed by canonical column names.
   */
  normalize?: (row: Record<string, string>) => Record<string, string>;
};

export const CSV_PRESETS: CsvPreset[] = [
  {
    id: "mt4",
    label: "MetaTrader 4",
    description: "Account history exported from MT4 (Ticket, Open Time, Type, Size, Item, Price, Close Time, Price, Commission, Swap, Profit).",
    headerCandidates: {
      externalId: ["ticket", "order"],
      entryDate: ["open time", "opentime"],
      direction: ["type"],
      size: ["size", "lots", "volume"],
      symbol: ["item", "symbol"],
      entryPrice: ["open price", "price"],
      exitDate: ["close time", "closetime"],
      exitPrice: ["close price", "price.1", "price_1"],
      fees: ["commission"],
      notes: ["comment"],
    },
  },
  {
    id: "mt5",
    label: "MetaTrader 5",
    description: "Deals/positions history exported from MT5 (Time, Position, Symbol, Type, Volume, Price, Time, Price, Commission, Swap, Profit).",
    headerCandidates: {
      entryDate: ["open time", "time"],
      externalId: ["position", "deal", "order"],
      symbol: ["symbol"],
      direction: ["type"],
      size: ["volume", "size", "lots"],
      entryPrice: ["open price", "price"],
      exitDate: ["close time", "time.1", "time_1"],
      exitPrice: ["close price", "price.1", "price_1"],
      fees: ["commission"],
      notes: ["comment"],
    },
  },
  {
    id: "ninjatrader",
    label: "NinjaTrader",
    description: "Trade Performance / executions export from NinjaTrader (Instrument, Market pos., Qty, Entry/Exit price, Entry/Exit time, Commission).",
    headerCandidates: {
      symbol: ["instrument", "symbol"],
      direction: ["market pos.", "market position", "position", "side"],
      size: ["qty", "quantity"],
      entryPrice: ["entry price", "entryprice"],
      exitPrice: ["exit price", "exitprice"],
      entryDate: ["entry time", "entrytime"],
      exitDate: ["exit time", "exittime"],
      fees: ["commission"],
      notes: ["trade #", "name"],
    },
  },
  {
    id: "interactivebrokers",
    label: "Interactive Brokers",
    description: "Trades CSV from IBKR Flex/Activity (Symbol, Buy/Sell, Quantity, TradePrice, Date/Time, IBCommission).",
    headerCandidates: {
      symbol: ["symbol", "underlyingsymbol"],
      direction: ["buy/sell", "side"],
      size: ["quantity", "qty"],
      entryPrice: ["tradeprice", "price"],
      entryDate: ["date/time", "datetime", "tradedate"],
      fees: ["ibcommission", "commission", "comm"],
      externalId: ["tradeid", "orderid"],
    },
  },
  {
    id: "thinkorswim",
    label: "thinkorswim (TD)",
    description: "Account statement / trade history from thinkorswim (Symbol, Side, Qty, Price, Exec Time).",
    headerCandidates: {
      symbol: ["symbol"],
      direction: ["side", "type"],
      size: ["qty", "quantity"],
      entryPrice: ["price", "net price"],
      entryDate: ["exec time", "time"],
      fees: ["commissions", "fees", "misc fees"],
    },
  },
  {
    id: "webull",
    label: "Webull / Robinhood",
    description: "Order history export from Webull or Robinhood (Symbol, Side, Filled Qty, Avg Price, Filled Time).",
    headerCandidates: {
      symbol: ["symbol", "name"],
      direction: ["side"],
      size: ["filled", "filled qty", "quantity", "shares"],
      entryPrice: ["avg price", "price", "average price"],
      entryDate: ["filled time", "date", "time"],
      fees: ["commission", "fees"],
    },
  },
  {
    id: "tradovate",
    label: "Tradovate (Performance export)",
    description:
      "The Performance / round-trip report exported from trader.tradovate.com (Performance → export). Auto-detected — just pick the file, no mapping needed. Futures P&L is priced with each contract's point value.",
    headerCandidates: {
      symbol: ["symbol"],
      direction: ["direction"],
      entryPrice: ["entry price"],
      exitPrice: ["exit price"],
      size: ["size"],
      entryDate: ["entry date"],
      exitDate: ["exit date"],
      fees: ["fees"],
      notes: ["notes"],
      externalId: ["id"],
    },
    normalize: normalizeTradovateRow,
  },
  {
    id: "generic",
    label: "Generic CSV",
    description: "Any CSV — map your columns manually below.",
    headerCandidates: {
      symbol: ["symbol", "ticker", "instrument", "item"],
      direction: ["direction", "side", "type"],
      entryPrice: ["entry price", "entry", "open price", "open"],
      exitPrice: ["exit price", "exit", "close price", "close"],
      size: ["size", "quantity", "qty", "volume", "lots", "shares"],
      fees: ["fees", "fee", "commission"],
      entryDate: ["entry date", "entry time", "open time", "date", "entry_date"],
      exitDate: ["exit date", "exit time", "close time", "exit_date"],
      strategy: ["strategy", "tag", "setup"],
      notes: ["notes", "comment", "description"],
      externalId: ["id", "ticket", "order id", "trade id"],
    },
  },
];

/**
 * Convert one Tradovate "Performance" round-trip row into canonical columns.
 * Tradovate reports each round trip with a buy leg and a sell leg (buyPrice /
 * sellPrice / boughtTimestamp / soldTimestamp) and no explicit direction — a
 * long bought first, a short sold first. Size is scaled by the contract's
 * dollar-per-point so the imported P&L lands in real dollars (MES $5, ES $50…).
 */
export function normalizeTradovateRow(row: Record<string, string>): Record<string, string> {
  const g = (name: string) => {
    const key = Object.keys(row).find((h) => h.trim().toLowerCase() === name);
    return key ? row[key] : undefined;
  };
  const symbol = (g("symbol") ?? "").trim();
  const qty = parseNumber(g("qty") ?? g("size")) ?? 0;
  const buyPrice = g("buyprice") ?? g("buy price") ?? "";
  const sellPrice = g("sellprice") ?? g("sell price") ?? "";
  const bought = g("boughttimestamp") ?? g("bought timestamp") ?? "";
  const sold = g("soldtimestamp") ?? g("sold timestamp") ?? "";
  const pnl = g("pnl") ?? g("p&l") ?? g("net p&l");

  const bt = Date.parse(bought);
  const st = Date.parse(sold);
  // Default to long unless the sell leg is clearly earlier than the buy leg.
  const isLong = !(Number.isFinite(bt) && Number.isFinite(st) && st < bt);
  const size = qty * dollarsPerPoint(symbol);

  return {
    symbol,
    direction: isLong ? "Buy" : "Sell",
    "entry price": isLong ? buyPrice : sellPrice,
    "exit price": isLong ? sellPrice : buyPrice,
    size: String(size),
    "entry date": isLong ? bought : sold,
    "exit date": isLong ? sold : bought,
    fees: "0",
    notes: pnl ? `Tradovate reported P&L: ${pnl}` : "",
    id: `${g("buyfillid") ?? ""}-${g("sellfillid") ?? ""}`,
  };
}

/** Guess a column mapping from CSV headers using a preset's candidates. */
export function autoMap(headers: string[], preset: CsvPreset): Partial<Record<TradeField, string>> {
  const lower = headers.map((h) => h.trim().toLowerCase());
  const used = new Set<number>();
  const mapping: Partial<Record<TradeField, string>> = {};
  for (const field of TRADE_FIELDS) {
    const candidates = preset.headerCandidates[field] ?? [];
    for (const cand of candidates) {
      const idx = lower.findIndex((h, i) => !used.has(i) && h === cand);
      if (idx >= 0) {
        mapping[field] = headers[idx];
        used.add(idx);
        break;
      }
    }
  }
  return mapping;
}

function parseNumber(raw: string | undefined): number | null {
  if (raw == null) return null;
  const cleaned = raw.replace(/[\s,$€£]/g, "").replace(/,(?=\d{3}\b)/g, "");
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Parse MT-style ("2026.03.15 14:30:05") and common date formats. */
function parseDate(raw: string | undefined): Date | null {
  if (!raw?.trim()) return null;
  let s = raw.trim();
  // MetaTrader uses dots: 2026.03.15 14:30[:05]
  const mt = s.match(/^(\d{4})\.(\d{2})\.(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (mt) {
    s = `${mt[1]}-${mt[2]}-${mt[3]}T${mt[4] ?? "00"}:${mt[5] ?? "00"}:${mt[6] ?? "00"}Z`;
  } else if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    s = s.replace(" ", "T") + (s.length === 16 ? ":00" : "") + "Z";
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function parseDirection(raw: string | undefined): "LONG" | "SHORT" | null {
  const v = raw?.trim().toLowerCase();
  if (!v) return null;
  if (v.startsWith("buy") || v === "long" || v === "b") return "LONG";
  if (v.startsWith("sell") || v === "short" || v === "s") return "SHORT";
  return null;
}

export type ParsedRow = {
  ok: boolean;
  error?: string;
  trade?: {
    symbol: string;
    direction: "LONG" | "SHORT";
    entryPrice: number;
    exitPrice: number | null;
    size: number;
    fees: number;
    entryDate: string;
    exitDate: string | null;
    strategy: string | null;
    notes: string | null;
    externalId: string | null;
  };
};

/** Convert one CSV row into a trade using the chosen column mapping. */
export function rowToTrade(
  row: Record<string, string>,
  mapping: Partial<Record<TradeField, string>>,
): ParsedRow {
  const get = (f: TradeField) => (mapping[f] ? row[mapping[f]!] : undefined);

  const symbol = get("symbol")?.trim().toUpperCase();
  const direction = parseDirection(get("direction"));
  const entryPrice = parseNumber(get("entryPrice"));
  const size = parseNumber(get("size"));
  const entryDate = parseDate(get("entryDate"));

  if (!symbol) return { ok: false, error: "missing symbol" };
  if (!direction) {
    // MT statements include balance/credit rows — skip them quietly.
    return { ok: false, error: `unrecognized direction "${get("direction") ?? ""}"` };
  }
  if (entryPrice == null || entryPrice <= 0) return { ok: false, error: "invalid entry price" };
  if (size == null || size <= 0) return { ok: false, error: "invalid size" };
  if (!entryDate) return { ok: false, error: "invalid entry date" };

  const exitPrice = parseNumber(get("exitPrice"));
  const exitDate = parseDate(get("exitDate"));
  const fees = Math.abs(parseNumber(get("fees")) ?? 0);
  const externalIdRaw = get("externalId")?.trim();

  const closed = exitPrice != null && exitPrice > 0 && exitDate != null;
  return {
    ok: true,
    trade: {
      symbol,
      direction,
      entryPrice,
      exitPrice: closed ? exitPrice : null,
      size,
      fees,
      entryDate: entryDate.toISOString(),
      exitDate: closed ? exitDate.toISOString() : null,
      strategy: get("strategy")?.trim() || null,
      notes: get("notes")?.trim() || null,
      externalId: externalIdRaw ? `csv:${externalIdRaw}` : null,
    },
  };
}
