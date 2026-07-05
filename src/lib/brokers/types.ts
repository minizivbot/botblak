/**
 * A broker-agnostic, closed (or open) round-trip trade produced by an adapter.
 * Adapters are responsible for pairing raw fills/orders into round trips.
 */
export type NormalizedTrade = {
  symbol: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number | null;
  size: number;
  fees: number;
  entryDate: Date;
  exitDate: Date | null;
  /** Stable broker-side id used to dedupe repeated syncs. */
  externalId: string;
  notes?: string;
};

export type SyncResult = {
  trades: NormalizedTrade[];
  /** Adapter-specific info worth surfacing to the user (e.g. "fetched 120 orders"). */
  detail?: string;
};

/** Per-user credentials entered on the site (stored encrypted server-side). */
export type BrokerCredentials = Record<string, string>;

export type CredentialField = {
  key: string;
  label: string;
  type?: "text" | "password";
  placeholder?: string;
  optional?: boolean;
};

/**
 * Adapter interface for broker API connections. To add a broker:
 *   1. Implement this interface in src/lib/brokers/<broker>.ts
 *   2. Register it in src/lib/brokers/index.ts
 * Credentials come from the signed-in user's saved connection (encrypted in
 * the DB) and fall back to server-wide .env values. They never reach the client.
 */
export interface BrokerAdapter {
  /** Machine name, used in API routes ("alpaca"). */
  id: string;
  /** Display name for the UI. */
  label: string;
  /** Fields the user fills in on the Import & Sync page. */
  credentialFields: CredentialField[];
  /** True when env-level credentials are present (server fallback). */
  envConfigured(): boolean;
  /**
   * Throw BrokerError if the credentials are rejected; used on connect.
   * May return a normalized copy of the credentials (e.g. corrected
   * environment) which is what gets stored.
   */
  verify(creds: BrokerCredentials): Promise<BrokerCredentials | void>;
  /** Fetch trades using the given credentials (or env fallback when null). */
  fetchTrades(creds: BrokerCredentials | null): Promise<SyncResult>;
}

export class BrokerError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "BrokerError";
  }
}
