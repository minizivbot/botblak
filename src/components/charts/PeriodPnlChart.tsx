"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chart, fmtCompactMoney, TooltipCard } from "./chartTheme";
import { fmtSignedMoney } from "@/lib/format";

type Bucket = { label: string; pnl: number };
type Period = "day" | "week" | "month";

export function PeriodPnlChart({
  data,
  currency,
}: {
  data: Record<Period, Bucket[]>;
  currency: string;
}) {
  const [period, setPeriod] = useState<Period>("day");
  const rows = data[period];

  return (
    <div>
      <div className="mb-3 flex gap-1" role="tablist" aria-label="P&L period">
        {(["day", "week", "month"] as const).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={period === p}
            onClick={() => setPeriod(p)}
            className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition-colors ${
              period === p ? "bg-raised text-ink" : "text-muted hover:text-ink-2"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="h-56 w-full">
        {rows.length === 0 ? (
          <p className="pt-16 text-center text-sm text-muted">No closed trades in this range.</p>
        ) : (
          <ResponsiveContainer>
            <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 4 }} barCategoryGap="25%">
              <CartesianGrid stroke={chart.grid} strokeWidth={1} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: chart.tick, fontSize: 10 }}
                axisLine={{ stroke: chart.axis }}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                tickFormatter={(v: number) => fmtCompactMoney(v, currency)}
                tick={{ fill: chart.tick, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <ReferenceLine y={0} stroke={chart.axis} strokeWidth={1} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as Bucket;
                  return (
                    <TooltipCard title={p.label} rows={[["Net P&L", fmtSignedMoney(p.pnl, currency)]]} />
                  );
                }}
              />
              <Bar dataKey="pnl" maxBarSize={24} isAnimationActive={false}>
                {rows.map((r) => (
                  <Cell
                    key={r.label}
                    fill={r.pnl >= 0 ? chart.profit : chart.loss}
                    radius={(r.pnl >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4]) as unknown as number}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
