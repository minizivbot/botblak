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

type Point = { date: string | null; dd: number };

/** Underwater curve: how far equity sits below its running peak. */
export function DrawdownChart({ points, currency }: { points: Point[]; currency: string }) {
  const data = points.map((p, i) => ({ ...p, i }));

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
          <CartesianGrid stroke={chart.grid} strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="i"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(i: number) => {
              const d = data[i]?.date;
              return d ? fmtDate(d) : "Start";
            }}
            ticks={data.length > 1 ? [0, data.length - 1] : [0]}
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
            domain={["auto", 0]}
          />
          <Tooltip
            cursor={{ stroke: chart.axis, strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as Point;
              return (
                <TooltipCard
                  title={p.date ? fmtDate(p.date) : "Start"}
                  rows={[["Drawdown", fmtMoney(p.dd, currency)]]}
                />
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="dd"
            stroke={chart.loss}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill={chart.loss}
            fillOpacity={0.1}
            isAnimationActive={false}
            dot={false}
            activeDot={{ r: 4, fill: chart.loss, stroke: "#16181c", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
