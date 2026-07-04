import { BrokerAdapter, BrokerError, SyncResult } from "./types";
import { pairFillsFifo, type Fill } from "./fifo";

type TvFill = {
  id: number;
  orderId: number;
  contractId: number;
  timestamp: string;
  action: "Buy" | "Sell";
  qty: number;
  price: number;
  active?: boolean;
};

type TvContract = { id: number; name: string };
type TvProduct = { name: string; valuePerPoint?: number };
type TvFillFee = { id: number } & Record<string, unknown>;

const FEE_FIELDS = ["clearingFee", "exchangeFee", "nfaFee", "brokerageFee", "commission", "orderRoutingFee"];

/**
 * Tradovate adapter (futures). Authenticates with the account's username and
 * password from .env (plus optional API cid/sec if you have an API key) and
 * pairs fills FIFO into round-trip trades. Futures P&L uses the product's
 * value-per-point, folded into the trade size so (exit - entry) x size is the
 * correct dollar P&L.
 */
export const tradovateAdapter: BrokerAdapter = {
  id: "tradovate",
  label: `Tradovate (${(process.env.TRADOVATE_ENV || "demo").toLowerCase() === "live" ? "live" : "demo"})`,

  isConfigured() {
    return Boolean(process.env.TRADOVATE_USERNAME && process.env.TRADOVATE_PASSWORD);
  },

  async fetchTrades(): Promise<SyncResult> {
    if (!this.isConfigured()) {
      throw new BrokerError(
        "Tradovate credentials are not configured. Set TRADOVATE_USERNAME and TRADOVATE_PASSWORD in .env (see README).",
      );
    }
    const env = (process.env.TRADOVATE_ENV || "demo").toLowerCase() === "live" ? "live" : "demo";
    const baseUrl = `https://${env}.tradovate.com/v1`;

    const token = await authenticate(baseUrl);
    const get = <T>(path: string) => apiGet<T>(baseUrl, token, path);

    const [rawFills, contracts, products, fillFees] = await Promise.all([
      get<TvFill[]>("/fill/list"),
      get<TvContract[]>("/contract/list").catch(() => [] as TvContract[]),
      get<TvProduct[]>("/product/list").catch(() => [] as TvProduct[]),
      get<TvFillFee[]>("/fillFee/list").catch(() => [] as TvFillFee[]),
    ]);

    const contractName = new Map(contracts.map((c) => [c.id, c.name]));
    // Missing contracts (list can be truncated) are fetched individually.
    const missing = [...new Set(rawFills.map((f) => f.contractId))].filter((id) => !contractName.has(id));
    for (const chunk of chunks(missing, 50)) {
      const items = await get<TvContract[]>(`/contract/items?ids=${chunk.join(",")}`).catch(() => []);
      for (const c of items) contractName.set(c.id, c.name);
    }

    // Product value-per-point, matched by longest product-name prefix of the
    // contract name (e.g. "ESM6" -> "ES", "MESM6" -> "MES").
    const byLen = [...products].sort((a, b) => b.name.length - a.name.length);
    const pointValue = (contract: string): { mult: number; product?: string } => {
      const p = byLen.find((p) => contract.startsWith(p.name));
      return p?.valuePerPoint ? { mult: p.valuePerPoint, product: p.name } : { mult: 1 };
    };

    const feeByFill = new Map<number, number>();
    for (const ff of fillFees) {
      const total = FEE_FIELDS.reduce((s, k) => s + (typeof ff[k] === "number" ? (ff[k] as number) : 0), 0);
      feeByFill.set(ff.id, total);
    }

    const fills: Fill[] = rawFills
      .filter((f) => f.active !== false)
      .map((f) => {
        const symbol = contractName.get(f.contractId) ?? `contract#${f.contractId}`;
        const { mult, product } = pointValue(symbol);
        return {
          id: String(f.id),
          symbol,
          side: f.action === "Buy" ? ("buy" as const) : ("sell" as const),
          qty: f.qty,
          price: f.price,
          date: new Date(f.timestamp),
          fee: feeByFill.get(f.id) ?? 0,
          sizeMultiplier: mult,
          notes: mult !== 1 ? `Futures: qty x $${mult}/pt (${product})` : undefined,
        };
      });

    return {
      trades: pairFillsFifo(fills, "tradovate"),
      detail: `Fetched ${rawFills.length} fills from Tradovate ${env}.`,
    };
  },
};

async function authenticate(baseUrl: string): Promise<string> {
  const body = {
    name: process.env.TRADOVATE_USERNAME!,
    password: process.env.TRADOVATE_PASSWORD!,
    appId: process.env.TRADOVATE_APP_ID || "TradingJournal",
    appVersion: "1.0",
    deviceId: process.env.TRADOVATE_DEVICE_ID || "trading-journal-local",
    ...(process.env.TRADOVATE_CID && process.env.TRADOVATE_SEC
      ? { cid: Number(process.env.TRADOVATE_CID), sec: process.env.TRADOVATE_SEC }
      : {}),
  };

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/auth/accesstokenrequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
  } catch (e) {
    throw new BrokerError(`Could not reach Tradovate: ${e instanceof Error ? e.message : String(e)}`);
  }
  const data = (await res.json().catch(() => ({}))) as {
    accessToken?: string;
    errorText?: string;
    "p-ticket"?: string;
    "p-time"?: number;
  };
  if (data["p-ticket"]) {
    throw new BrokerError(
      `Tradovate is rate-limiting or requires a captcha (wait ${data["p-time"] ?? "a few"}s and try again).`,
      429,
    );
  }
  if (!res.ok || !data.accessToken) {
    throw new BrokerError(
      `Tradovate login failed: ${data.errorText || `HTTP ${res.status}`}. Check TRADOVATE_USERNAME/PASSWORD in .env.`,
      res.status === 200 ? 401 : res.status,
    );
  }
  return data.accessToken;
}

async function apiGet<T>(baseUrl: string, token: string, path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });
  } catch (e) {
    throw new BrokerError(`Tradovate request ${path} failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (res.status === 401 || res.status === 403) {
    throw new BrokerError("Tradovate rejected the session (401/403). Check your credentials.", res.status);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new BrokerError(`Tradovate API error ${res.status} on ${path}: ${text.slice(0, 200)}`, res.status);
  }
  return (await res.json()) as T;
}

function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
