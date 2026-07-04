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

/**
 * Adapter interface for broker API connections. To add a broker:
 *   1. Implement this interface in src/lib/brokers/<broker>.ts
 *   2. Register it in src/lib/brokers/index.ts
 * Adapters run on the server only — API keys come from process.env and are
 * never sent to the client.
 */
export interface BrokerAdapter {
  /** Machine name, used in API routes ("alpaca"). */
  id: string;
  /** Display name for the UI. */
  label: string;
  /** True when the required environment variables are present. */
  isConfigured(): boolean;
  /** Fetch trades since the given date (or all available history). */
  fetchTrades(since?: Date): Promise<SyncResult>;
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
