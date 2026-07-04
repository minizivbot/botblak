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

/** Horizontal bars of net P&L per symbol or per strategy. */
export function GroupPnlChart({ rows, currency }: { rows: Row[]; currency: string }) {
  const height = Math.max(160, rows.length * 34 + 40);

  if (rows.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">No closed trades in this range.</p>;
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid stroke={chart.grid} strokeWidth={1} horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v: number) => fmtCompactMoney(v, currency)}
            tick={{ fill: chart.tick, fontSize: 11 }}
            axisLine={{ stroke: chart.axis }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: chart.tick, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <ReferenceLine x={0} stroke={chart.axis} strokeWidth={1} />
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
          <Bar dataKey="pnl" maxBarSize={20} isAnimationActive={false}>
            {rows.map((r) => (
              <Cell
                key={r.label}
                fill={r.pnl >= 0 ? chart.profit : chart.loss}
                radius={(r.pnl >= 0 ? [0, 4, 4, 0] : [4, 0, 0, 4]) as unknown as number}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
