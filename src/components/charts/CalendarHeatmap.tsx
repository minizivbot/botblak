"use client";

import { useState } from "react";
import { fmtSignedMoney, fmtDate } from "@/lib/format";

type Props = {
  /** Net P&L per day, keyed "YYYY-MM-DD". */
  daily: Record<string, number>;
  currency: string;
  /** Number of trailing weeks to show. */
  weeks?: number;
};

const DAY_MS = 86400000;
const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Calendar heatmap of daily P&L: columns are weeks (Mon-first), rows weekdays.
 * Diverging encoding — teal arm for profit days, red arm for loss days, with
 * intensity scaled to the largest absolute daily P&L. Sign is also written in
 * the tooltip so color is never the only channel.
 */
export function CalendarHeatmap({ daily, currency, weeks = 16 }: Props) {
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);

  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  // End the grid on the Sunday of the current week.
  const endOffset = 7 - (todayUtc.getUTCDay() || 7);
  const end = new Date(todayUtc.getTime() + endOffset * DAY_MS);
  const start = new Date(end.getTime() - (weeks * 7 - 1) * DAY_MS);

  const max = Math.max(1, ...Object.values(daily).map(Math.abs));

  const columns: { date: Date; key: string; pnl: number | undefined; future: boolean }[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start.getTime() + (w * 7 + d) * DAY_MS);
      const key = isoDay(date);
      col.push({ date, key, pnl: daily[key], future: date.getTime() > todayUtc.getTime() });
    }
    columns.push(col);
  }

  // Month label above the first column that starts a new month.
  const monthLabels = columns.map((col, i) => {
    const m = col[0].date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
    const prev = i > 0 ? columns[i - 1][0].date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }) : null;
    return m !== prev ? m : "";
  });

  const cellColor = (pnl: number | undefined): string => {
    if (pnl === undefined || pnl === 0) return "transparent";
    const t = 0.25 + 0.75 * Math.min(1, Math.abs(pnl) / max);
    return pnl > 0 ? `rgba(25, 158, 112, ${t.toFixed(2)})` : `rgba(230, 103, 103, ${t.toFixed(2)})`;
  };

  return (
    <div className="relative">
      <div className="overflow-x-auto pb-1">
        <div className="inline-block min-w-full">
          <div className="mb-1 ml-9 flex gap-[3px] text-[10px] text-muted">
            {monthLabels.map((m, i) => (
              <span key={i} className="w-4 shrink-0">{m}</span>
            ))}
          </div>
          <div className="flex gap-[3px]">
            <div className="mr-1 flex w-8 flex-col gap-[3px] text-[10px] leading-4 text-muted">
              {WEEKDAY_LABELS.map((l, i) => (
                <span key={i} className="h-4">{l}</span>
              ))}
            </div>
            {columns.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[3px]">
                {col.map((cell) => (
                  <div
                    key={cell.key}
                    className="h-4 w-4 shrink-0 rounded-[3px] border border-edge/60"
                    style={{
                      backgroundColor: cell.future ? "transparent" : cellColor(cell.pnl),
                      opacity: cell.future ? 0.3 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (cell.future) return;
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      const parent = (e.currentTarget.closest(".relative") as HTMLElement).getBoundingClientRect();
                      setTip({
                        x: rect.left - parent.left + 8,
                        y: rect.top - parent.top - 34,
                        text: `${fmtDate(cell.key)} — ${
                          cell.pnl === undefined ? "no trades" : fmtSignedMoney(cell.pnl, currency)
                        }`,
                      });
                    }}
                    onMouseLeave={() => setTip(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[10px] text-muted">
        <span>Loss</span>
        {[-1, -0.5, 0, 0.5, 1].map((v) => (
          <span
            key={v}
            className="h-3 w-3 rounded-[3px] border border-edge/60"
            style={{ backgroundColor: v === 0 ? "#383835" : cellColor(v * max) }}
          />
        ))}
        <span>Profit</span>
      </div>
      {tip && (
        <div
          className="pointer-events-none absolute z-10 whitespace-nowrap rounded-md border border-edge bg-raised px-2 py-1 text-xs text-ink shadow-lg"
          style={{ left: tip.x, top: tip.y }}
        >
          {tip.text}
        </div>
      )}
    </div>
  );
}
