import { BrokerAdapter, BrokerError, NormalizedTrade, SyncResult } from "./types";

type AlpacaOrder = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  filled_qty: string;
  filled_avg_price: string | null;
  filled_at: string | null;
  status: string;
};

/**
 * Alpaca adapter (paper trading by default).
 *
 * Fetches closed, filled orders from the Alpaca Trading API and pairs them
 * FIFO per symbol into round-trip trades: a buy opens (or covers) and a sell
 * closes (or opens a short), matched in fill-time order.
 */
export const alpacaAdapter: BrokerAdapter = {
  id: "alpaca",
  label: "Alpaca (paper)",

  isConfigured() {
    return Boolean(process.env.ALPACA_API_KEY_ID && process.env.ALPACA_API_SECRET_KEY);
  },

  async fetchTrades(since?: Date): Promise<SyncResult> {
    if (!this.isConfigured()) {
      throw new BrokerError(
        "Alpaca keys are not configured. Set ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY in .env (see README).",
      );
    }
    const baseUrl = process.env.ALPACA_BASE_URL || "https://paper-api.alpaca.markets";
    const headers = {
      "APCA-API-KEY-ID": process.env.ALPACA_API_KEY_ID!,
      "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET_KEY!,
    };

    // Page through closed orders, oldest first.
    const orders: AlpacaOrder[] = [];
    let after = since ? since.toISOString() : "2015-01-01T00:00:00Z";
    for (let page = 0; page < 20; page++) {
      const url = new URL("/v2/orders", baseUrl);
      url.searchParams.set("status", "closed");
      url.searchParams.set("direction", "asc");
      url.searchParams.set("limit", "500");
      url.searchParams.set("after", after);

      let res: Response;
      try {
        res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
      } catch (e) {
        throw new BrokerError(
          `Could not reach Alpaca at ${baseUrl}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
      if (res.status === 401 || res.status === 403) {
        throw new BrokerError("Alpaca rejected the API keys (401/403). Check your .env values.", res.status);
      }
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new BrokerError(`Alpaca API error ${res.status}: ${body.slice(0, 200)}`, res.status);
      }
      const batch = (await res.json()) as AlpacaOrder[];
      orders.push(...batch);
      if (batch.length < 500) break;
      const last = batch[batch.length - 1].filled_at;
      if (!last) break;
      after = last;
    }

    const fills = orders
      .filter((o) => o.status === "filled" && o.filled_at && o.filled_avg_price)
      .sort((a, b) => new Date(a.filled_at!).getTime() - new Date(b.filled_at!).getTime());

    return {
      trades: pairFillsFifo(fills),
      detail: `Fetched ${orders.length} closed orders (${fills.length} filled) from Alpaca.`,
    };
  },
};

type OpenLot = {
  direction: "LONG" | "SHORT";
  qty: number;
  price: number;
  date: Date;
  orderId: string;
};

/** Pair filled orders into round-trip trades, FIFO per symbol. */
export function pairFillsFifo(fills: AlpacaOrder[]): NormalizedTrade[] {
  const lots = new Map<string, OpenLot[]>();
  const trades: NormalizedTrade[] = [];

  for (const f of fills) {
    let qty = parseFloat(f.filled_qty);
    const price = parseFloat(f.filled_avg_price!);
    const date = new Date(f.filled_at!);
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price)) continue;

    const queue = lots.get(f.symbol) ?? [];
    lots.set(f.symbol, queue);
    const closes: "LONG" | "SHORT" = f.side === "sell" ? "LONG" : "SHORT";
    const opens: "LONG" | "SHORT" = f.side === "buy" ? "LONG" : "SHORT";

    // First close out any opposite-direction lots FIFO...
    while (qty > 0 && queue.length && queue[0].direction === closes) {
      const lot = queue[0];
      const matched = Math.min(qty, lot.qty);
      trades.push({
        symbol: f.symbol,
        direction: lot.direction,
        entryPrice: lot.price,
        exitPrice: price,
        size: matched,
        fees: 0, // Alpaca is commission-free for stocks
        entryDate: lot.date,
        exitDate: date,
        externalId: `alpaca:${lot.orderId}:${f.id}`,
      });
      lot.qty -= matched;
      qty -= matched;
      if (lot.qty <= 1e-9) queue.shift();
    }
    // ...then whatever remains opens a new lot.
    if (qty > 0) {
      queue.push({ direction: opens, qty, price, date, orderId: f.id });
    }
  }

  // Remaining lots are still-open positions — import them as open trades.
  for (const [symbol, queue] of lots) {
    for (const lot of queue) {
      trades.push({
        symbol,
        direction: lot.direction,
        entryPrice: lot.price,
        exitPrice: null,
        size: lot.qty,
        fees: 0,
        entryDate: lot.date,
        exitDate: null,
        externalId: `alpaca:${lot.orderId}:open`,
      });
    }
  }

  return trades.sort((a, b) => a.entryDate.getTime() - b.entryDate.getTime());
}
