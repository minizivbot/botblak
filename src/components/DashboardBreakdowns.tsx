"use client";

import { useState } from "react";
import { PeriodPnlChart } from "@/components/charts/PeriodPnlChart";
import { GroupPnlChart } from "@/components/charts/GroupPnlChart";
import { WeekdayPnlChart } from "@/components/charts/WeekdayPnlChart";
import { CalendarHeatmap } from "@/components/charts/CalendarHeatmap";

type Row = { label: string; pnl: number; count: number };
type Bucket = { label: string; pnl: number };

type Props = {
  currency: string;
  period: Record<"day" | "week" | "month", Bucket[]>;
  daily: Record<string, number>;
  killzone: Row[];
  setup: Row[];
  symbol: Row[];
  weekday: Row[];
  concept: Row[];
};

const TABS = ["Over time", "Calendar", "Killzone", "Setup", "Symbol", "Weekday", "Concepts"] as const;
type Tab = (typeof TABS)[number];

/**
 * All the P&L breakdowns in ONE card with tabs, instead of seven stacked
 * cards — keeps the dashboard short while every view stays a tap away.
 */
export function DashboardBreakdowns({ currency, period, daily, killzone, setup, symbol, weekday, concept }: Props) {
  const [tab, setTab] = useState<Tab>("Over time");
  // Hide the Concepts tab entirely when nothing is tagged.
  const tabs = TABS.filter((t) => t !== "Concepts" || concept.length > 0);

  return (
    <section className="card">
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t
                ? "border-accent/60 bg-accent/15 text-ink"
                : "border-edge text-muted hover:border-edge-strong hover:text-ink-2"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Over time" && <PeriodPnlChart data={period} currency={currency} />}
      {tab === "Calendar" && <CalendarHeatmap daily={daily} currency={currency} />}
      {tab === "Killzone" && (
        <>
          <GroupPnlChart rows={killzone} currency={currency} />
          <p className="mt-2 text-xs text-muted">By entry time, New York time — ICT killzone windows.</p>
        </>
      )}
      {tab === "Setup" && <GroupPnlChart rows={setup} currency={currency} />}
      {tab === "Symbol" && <GroupPnlChart rows={symbol} currency={currency} />}
      {tab === "Weekday" && <WeekdayPnlChart rows={weekday} currency={currency} />}
      {tab === "Concepts" && (
        <>
          <GroupPnlChart rows={concept} currency={currency} />
          <p className="mt-2 text-xs text-muted">
            Each trade&apos;s P&L counts toward every concept you tagged on it — see which reads actually pay.
          </p>
        </>
      )}
    </section>
  );
}
