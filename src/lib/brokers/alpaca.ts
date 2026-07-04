import { BrokerAdapter, BrokerError, SyncResult } from "./types";
import { pairFillsFifo, type Fill } from "./fifo";

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
 * FIFO per symbol into round-trip trades.
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

    const fills: Fill[] = orders
      .filter((o) => o.status === "filled" && o.filled_at && o.filled_avg_price)
      .map((o) => ({
        id: o.id,
        symbol: o.symbol,
        side: o.side,
        qty: parseFloat(o.filled_qty),
        price: parseFloat(o.filled_avg_price!),
        date: new Date(o.filled_at!),
        fee: 0, // Alpaca is commission-free for stocks
      }));

    return {
      trades: pairFillsFifo(fills, "alpaca"),
      detail: `Fetched ${orders.length} closed orders (${fills.length} filled) from Alpaca.`,
    };
  },
};
