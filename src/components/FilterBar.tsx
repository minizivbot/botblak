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

  const setRange = useCallback(
    (days: number | "ytd" | "all") => {
      const next = new URLSearchParams(params.toString());
      if (days === "all") {
        next.delete("from");
        next.delete("to");
      } else {
        const today = new Date();
        const from =
          days === "ytd"
            ? new Date(Date.UTC(today.getUTCFullYear(), 0, 1))
            : new Date(today.getTime() - days * 86400000);
        next.set("from", from.toISOString().slice(0, 10));
        next.delete("to");
      }
      router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const hasFilters = ["from", "to", "symbol", "strategy", "direction"].some((k) => params.get(k));
  const presets: { label: string; value: number | "ytd" | "all" }[] = [
    { label: "7D", value: 7 },
    { label: "30D", value: 30 },
    { label: "90D", value: 90 },
    { label: "YTD", value: "ytd" },
    { label: "All", value: "all" },
  ];
  const activePreset = (() => {
    if (params.get("to")) return null;
    const from = params.get("from");
    if (!from) return "all";
    const days = Math.round((Date.now() - new Date(`${from}T00:00:00Z`).getTime()) / 86400000);
    for (const d of [7, 30, 90]) if (Math.abs(days - d) <= 1) return d;
    const y = new Date();
    if (from === `${y.getUTCFullYear()}-01-01`) return "ytd";
    return null;
  })();

  return (
    <div className="card flex flex-wrap items-end gap-3">
      <div className="flex w-full flex-wrap items-center gap-2 border-b border-edge pb-3">
        {presets.map((p) => (
          <button
            key={p.label}
            className={`chip ${activePreset === p.value ? "chip-active" : ""}`}
            onClick={() => setRange(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>
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
