import { alpacaAdapter } from "./alpaca";
import type { BrokerAdapter } from "./types";

/** Registry of broker adapters. Add new brokers here. */
export const brokers: Record<string, BrokerAdapter> = {
  [alpacaAdapter.id]: alpacaAdapter,
};

export function getBroker(id: string): BrokerAdapter | undefined {
  return brokers[id];
}

export { BrokerError } from "./types";
export type { BrokerAdapter, NormalizedTrade, SyncResult } from "./types";
