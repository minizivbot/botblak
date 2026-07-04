"use client";

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

type Row = { label: string; pnl: number; count: number };

/** Net P&L per weekday — spot which sessions actually make you money. */
export function WeekdayPnlChart({ rows, currency }: { rows: Row[]; currency: string }) {
  if (rows.every((r) => r.count === 0)) {
    return <p className="py-10 text-center text-sm text-muted">No closed trades in this range.</p>;
  }
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 4 }} barCategoryGap="30%">
          <CartesianGrid stroke={chart.grid} strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: chart.tick, fontSize: 11 }}
            axisLine={{ stroke: chart.axis }}
            tickLine={false}
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
              const p = payload[0].payload as Row;
              return (
                <TooltipCard
                  title={p.label}
                  rows={[
                    ["Net P&L", fmtSignedMoney(p.pnl, currency)],
                    ["Trades", String(p.count)],
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="pnl" maxBarSize={24} isAnimationActive={false}>
            {rows.map((r) => (
              <Cell
                key={r.label}
                fill={r.count === 0 ? chart.grid : r.pnl >= 0 ? chart.profit : chart.loss}
                radius={(r.pnl >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4]) as unknown as number}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
