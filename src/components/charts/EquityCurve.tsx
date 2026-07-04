"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chart, fmtCompactMoney, TooltipCard } from "./chartTheme";
import { fmtMoney, fmtDate } from "@/lib/format";

type Point = { date: string | null; equity: number };

export function EquityCurve({ points, currency }: { points: Point[]; currency: string }) {
  const data = points.map((p, i) => ({ ...p, i }));

  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
          <CartesianGrid stroke={chart.grid} strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="i"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(i: number) => {
              const d = data[i]?.date;
              return d ? fmtDate(d) : "Start";
            }}
            ticks={data.length > 1 ? [0, Math.floor((data.length - 1) / 2), data.length - 1] : [0]}
            tick={{ fill: chart.tick, fontSize: 11 }}
            axisLine={{ stroke: chart.axis }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => fmtCompactMoney(v, currency)}
            tick={{ fill: chart.tick, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={56}
            domain={["auto", "auto"]}
          />
          <Tooltip
            cursor={{ stroke: chart.axis, strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as Point & { i: number };
              return (
                <TooltipCard
                  title={p.date ? fmtDate(p.date) : "Starting balance"}
                  rows={[["Equity", fmtMoney(p.equity, currency)]]}
                />
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke={chart.accent}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill={chart.accent}
            fillOpacity={0.1}
            isAnimationActive={false}
            dot={false}
            activeDot={{ r: 4, fill: chart.accent, stroke: "#1a1a19", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
