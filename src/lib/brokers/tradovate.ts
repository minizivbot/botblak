import { BrokerAdapter, BrokerCredentials, BrokerError, SyncResult } from "./types";
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

type Resolved = { username: string; password: string; env: "demo" | "live"; cid?: string; sec?: string };

function resolve(creds: BrokerCredentials | null): Resolved | null {
  if (creds?.username && creds?.password) {
    return {
      username: creds.username,
      password: creds.password,
      env: creds.env?.toLowerCase() === "live" ? "live" : "demo",
      cid: creds.cid || undefined,
      sec: creds.sec || undefined,
    };
  }
  if (process.env.TRADOVATE_USERNAME && process.env.TRADOVATE_PASSWORD) {
    return {
      username: process.env.TRADOVATE_USERNAME,
      password: process.env.TRADOVATE_PASSWORD,
      env: (process.env.TRADOVATE_ENV || "demo").toLowerCase() === "live" ? "live" : "demo",
      cid: process.env.TRADOVATE_CID || undefined,
      sec: process.env.TRADOVATE_SEC || undefined,
    };
  }
  return null;
}

/**
 * Tradovate adapter (futures). Signs in with the account's username/password,
 * pairs fills FIFO into round trips, and prices futures P&L with each
 * product's value-per-point folded into the trade size.
 */
export const tradovateAdapter: BrokerAdapter = {
  id: "tradovate",
  label: "Tradovate (futures)",
  credentialFields: [
    { key: "username", label: "Username" },
    { key: "password", label: "Password", type: "password" },
    { key: "env", label: "Environment (demo / live)", placeholder: "demo", optional: true },
    { key: "cid", label: "API Client ID (only if Tradovate asks for it)", optional: true },
    { key: "sec", label: "API Client Secret", type: "password", optional: true },
  ],

  envConfigured() {
    return Boolean(process.env.TRADOVATE_USERNAME && process.env.TRADOVATE_PASSWORD);
  },

  async verify(creds: BrokerCredentials): Promise<void> {
    const r = resolve(creds);
    if (!r) throw new BrokerError("Username and password are required.");
    await authenticate(r); // throws BrokerError when rejected
  },

  async fetchTrades(creds: BrokerCredentials | null): Promise<SyncResult> {
    const r = resolve(creds);
    if (!r) {
      throw new BrokerError("Tradovate is not connected. Add your username and password on the Import & Sync page.");
    }
    const baseUrl = `https://${r.env}.tradovateapi.com/v1`;
    const token = await authenticate(r);
    const get = <T>(path: string) => apiGet<T>(baseUrl, token, path);

    const [rawFills, contracts, products, fillFees] = await Promise.all([
      get<TvFill[]>("/fill/list"),
      get<TvContract[]>("/contract/list").catch(() => [] as TvContract[]),
      get<TvProduct[]>("/product/list").catch(() => [] as TvProduct[]),
      get<TvFillFee[]>("/fillFee/list").catch(() => [] as TvFillFee[]),
    ]);

    const contractName = new Map(contracts.map((c) => [c.id, c.name]));
    const missing = [...new Set(rawFills.map((f) => f.contractId))].filter((id) => !contractName.has(id));
    for (const chunk of chunks(missing, 50)) {
      const items = await get<TvContract[]>(`/contract/items?ids=${chunk.join(",")}`).catch(() => []);
      for (const c of items) contractName.set(c.id, c.name);
    }

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
      detail: `Fetched ${rawFills.length} fills from Tradovate ${r.env}.`,
    };
  },
};

async function authenticate(r: Resolved): Promise<string> {
  const baseUrl = `https://${r.env}.tradovateapi.com/v1`;
  const body = {
    name: r.username,
    password: r.password,
    appId: process.env.TRADOVATE_APP_ID || "TradeZone",
    appVersion: "1.0",
    deviceId: process.env.TRADOVATE_DEVICE_ID || "tradezone-web",
    ...(r.cid && r.sec ? { cid: Number(r.cid), sec: r.sec } : {}),
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
      `Tradovate login failed: ${data.errorText || `HTTP ${res.status}`}. Check the username and password.`,
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
    throw new BrokerError("Tradovate rejected the session (401/403). Re-connect with valid credentials.", res.status);
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
