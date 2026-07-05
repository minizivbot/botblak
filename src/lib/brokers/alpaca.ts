import { BrokerAdapter, BrokerCredentials, BrokerError, SyncResult } from "./types";
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

type Resolved = { keyId: string; secretKey: string; baseUrl: string };

function resolve(creds: BrokerCredentials | null): Resolved | null {
  if (creds?.keyId && creds?.secretKey) {
    return {
      keyId: creds.keyId,
      secretKey: creds.secretKey,
      baseUrl: creds.baseUrl?.trim() || "https://paper-api.alpaca.markets",
    };
  }
  if (process.env.ALPACA_API_KEY_ID && process.env.ALPACA_API_SECRET_KEY) {
    return {
      keyId: process.env.ALPACA_API_KEY_ID,
      secretKey: process.env.ALPACA_API_SECRET_KEY,
      baseUrl: process.env.ALPACA_BASE_URL || "https://paper-api.alpaca.markets",
    };
  }
  return null;
}

function headers(r: Resolved) {
  return { "APCA-API-KEY-ID": r.keyId, "APCA-API-SECRET-KEY": r.secretKey };
}

/**
 * Alpaca adapter (paper trading by default). Pulls closed, filled orders and
 * pairs them FIFO per symbol into round-trip trades.
 */
export const alpacaAdapter: BrokerAdapter = {
  id: "alpaca",
  label: "Alpaca (stocks, paper)",
  credentialFields: [
    { key: "keyId", label: "API Key ID", placeholder: "PK…" },
    { key: "secretKey", label: "API Secret Key", type: "password" },
    { key: "baseUrl", label: "API URL", placeholder: "https://paper-api.alpaca.markets", optional: true },
  ],

  envConfigured() {
    return Boolean(process.env.ALPACA_API_KEY_ID && process.env.ALPACA_API_SECRET_KEY);
  },

  async verify(creds: BrokerCredentials): Promise<void> {
    const r = resolve(creds);
    if (!r) throw new BrokerError("API Key ID and Secret Key are required.");
    let res: Response;
    try {
      res = await fetch(`${r.baseUrl}/v2/account`, { headers: headers(r), signal: AbortSignal.timeout(12000) });
    } catch (e) {
      throw new BrokerError(`Could not reach Alpaca: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (res.status === 401 || res.status === 403) {
      throw new BrokerError("Alpaca rejected these keys. Check the Key ID and Secret.", res.status);
    }
    if (!res.ok) throw new BrokerError(`Alpaca error ${res.status} while verifying the keys.`, res.status);
  },

  async fetchTrades(creds: BrokerCredentials | null): Promise<SyncResult> {
    const r = resolve(creds);
    if (!r) {
      throw new BrokerError("Alpaca is not connected. Add your API keys on the Import & Sync page.");
    }

    // Page through closed orders, oldest first.
    const orders: AlpacaOrder[] = [];
    let after = "2015-01-01T00:00:00Z";
    for (let page = 0; page < 20; page++) {
      const url = new URL("/v2/orders", r.baseUrl);
      url.searchParams.set("status", "closed");
      url.searchParams.set("direction", "asc");
      url.searchParams.set("limit", "500");
      url.searchParams.set("after", after);

      let res: Response;
      try {
        res = await fetch(url, { headers: headers(r), signal: AbortSignal.timeout(15000) });
      } catch (e) {
        throw new BrokerError(
          `Could not reach Alpaca at ${r.baseUrl}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
      if (res.status === 401 || res.status === 403) {
        throw new BrokerError("Alpaca rejected the API keys (401/403). Re-connect with valid keys.", res.status);
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
