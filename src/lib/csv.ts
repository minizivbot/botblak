/**
 * CSV import: column-mapping presets for MetaTrader 4/5 statements and a
 * generic preset, plus the row -> trade converter used by the import page.
 */

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
