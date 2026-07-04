"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Props = {
  symbols: string[];
  strategies: string[];
};

/** Shared filter row: date range, symbol, strategy, direction. State lives in the URL. */
export function FilterBar({ symbols, strategies }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const hasFilters = ["from", "to", "symbol", "strategy", "direction"].some((k) => params.get(k));

  return (
    <div className="card flex flex-wrap items-end gap-3">
      <div>
        <label className="field-label" htmlFor="f-from">From</label>
        <input
          id="f-from"
          type="date"
          className="field w-auto"
          value={params.get("from") ?? ""}
          onChange={(e) => setParam("from", e.target.value)}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="f-to">To</label>
        <input
          id="f-to"
          type="date"
          className="field w-auto"
          value={params.get("to") ?? ""}
          onChange={(e) => setParam("to", e.target.value)}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="f-symbol">Symbol</label>
        <select
          id="f-symbol"
          className="field w-auto"
          value={params.get("symbol") ?? ""}
          onChange={(e) => setParam("symbol", e.target.value)}
        >
          <option value="">All</option>
          {symbols.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="f-strategy">Strategy</label>
        <select
          id="f-strategy"
          className="field w-auto"
          value={params.get("strategy") ?? ""}
          onChange={(e) => setParam("strategy", e.target.value)}
        >
          <option value="">All</option>
          {strategies.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="f-direction">Direction</label>
        <select
          id="f-direction"
          className="field w-auto"
          value={params.get("direction") ?? ""}
          onChange={(e) => setParam("direction", e.target.value)}
        >
          <option value="">All</option>
          <option value="LONG">Long</option>
          <option value="SHORT">Short</option>
        </select>
      </div>
      {hasFilters && (
        <button className="btn-ghost" onClick={() => router.replace(pathname, { scroll: false })}>
          Clear filters
        </button>
      )}
    </div>
  );
}
