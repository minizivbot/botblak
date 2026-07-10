"use client";

import { useState } from "react";
import { fmtSignedMoney } from "@/lib/format";

export type DayTrade = { symbol: string; direction: string; pnl: number; account: string | null; time: string };
export type DayAccount = { name: string; pnl: number; count: number };
export type DayDetail = { pnl: number; count: number; wins: number; rr: number | null; trades: DayTrade[]; accounts: DayAccount[] };
export type DayNewsLite = { time: string; currency: string; title: string };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "$1.2K" style compact money for tight calendar cells. */
function compact(n: number): string {
  const abs = Math.abs(n);
  const s = abs >= 10000 ? `${(abs / 1000).toFixed(0)}K` : abs >= 1000 ? `${(abs / 1000).toFixed(1)}K` : abs.toFixed(0);
  return `${n < 0 ? "-" : "+"}$${s}`;
}

function RedFolder({ events }: { events: DayNewsLite[] }) {
  const label = events.map((e) => `${e.time ? e.time + " " : ""}${e.currency} — ${e.title}`).join("\n");
  return (
    <span title={label} className="inline-flex items-center" aria-label="High-impact news">
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
        <path
          d="M1.5 3.5A1.5 1.5 0 013 2h3l1.5 1.8H13A1.5 1.5 0 0114.5 5.3v7.2A1.5 1.5 0 0113 14H3a1.5 1.5 0 01-1.5-1.5v-9z"
          fill="#ef4444"
        />
      </svg>
      {events.length > 1 && <span className="ml-0.5 text-[9px] font-bold text-loss">{events.length}</span>}
    </span>
  );
}

export function CalendarGrid({
  month,
  currency,
  weeks,
  days,
  news,
  nyToday,
}: {
  month: string; // "YYYY-MM"
  currency: string;
  weeks: (number | null)[][];
  days: Record<string, DayDetail>;
  news: Record<string, DayNewsLite[]>;
  nyToday: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const key = (d: number) => `${month}-${String(d).padStart(2, "0")}`;
  const isToday = (d: number) => key(d) === nyToday;

  return (
    <>
      <div className="card overflow-x-auto p-2 sm:p-3">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[repeat(7,1fr)_5rem] gap-1.5 pb-1.5 text-center text-[11px] font-semibold text-muted">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
            <span>Week</span>
          </div>
          <div className="space-y-1.5">
            {weeks.map((week, wi) => {
              const weekTotal = week.reduce((s: number, d) => s + (d ? days[key(d)]?.pnl ?? 0 : 0), 0);
              const weekHasTrades = week.some((d) => d && days[key(d)]);
              return (
                <div key={wi} className="grid grid-cols-[repeat(7,1fr)_5rem] gap-1.5">
                  {week.map((d, di) => {
                    if (d == null) return <div key={di} className="min-h-16 rounded-lg" />;
                    const data = days[key(d)];
                    const events = news[key(d)];
                    const toneCls = !data
                      ? "border-edge bg-raised/20"
                      : data.pnl > 0
                        ? "border-profit/40 bg-profit/10"
                        : data.pnl < 0
                          ? "border-loss/40 bg-loss/10"
                          : "border-edge bg-raised/40";
                    const clickable = !!data;
                    const cls = `min-h-16 w-full rounded-lg border px-1.5 py-1 text-left ${toneCls} ${
                      isToday(d) ? "ring-1 ring-accent" : ""
                    } ${clickable ? "cursor-pointer transition-transform hover:-translate-y-0.5 hover:border-accent/60" : ""}`;
                    const inner = (
                      <>
                        <div className="flex items-start justify-between">
                          <span className={`text-[11px] ${isToday(d) ? "font-bold text-accent" : "text-muted"}`}>{d}</span>
                          {events && <RedFolder events={events} />}
                        </div>
                        {data && (
                          <>
                            <p className={`text-xs font-bold tabular-nums ${data.pnl > 0 ? "text-profit" : data.pnl < 0 ? "text-loss" : "text-ink-2"}`}>
                              {compact(data.pnl)}
                            </p>
                            <p className="text-[10px] text-muted">
                              {data.count} trade{data.count === 1 ? "" : "s"}
                            </p>
                          </>
                        )}
                      </>
                    );
                    return clickable ? (
                      <button key={di} type="button" className={cls} onClick={() => setSelected(key(d))}>
                        {inner}
                      </button>
                    ) : (
                      <div key={di} className={cls}>{inner}</div>
                    );
                  })}
                  <div className="flex min-h-16 flex-col items-center justify-center rounded-lg border border-edge bg-raised/30 px-1">
                    {weekHasTrades ? (
                      <p className={`text-xs font-bold tabular-nums ${weekTotal > 0 ? "text-profit" : weekTotal < 0 ? "text-loss" : "text-ink-2"}`}>
                        {compact(weekTotal)}
                      </p>
                    ) : (
                      <span className="text-[10px] text-muted">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selected && days[selected] && (
        <DayModal date={selected} detail={days[selected]} currency={currency} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

function DayModal({
  date,
  detail,
  currency,
  onClose,
}: {
  date: string;
  detail: DayDetail;
  currency: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const src = `/api/share/day/${date}?t=${Date.now()}`;
  const label = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  async function copyImage() {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard image write isn't universal — download still works */
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center" onClick={onClose}>
      <div className="card w-full max-w-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">{label}</h2>
            <p className="text-xs text-muted">
              {detail.count} trade{detail.count === 1 ? "" : "s"}
              {detail.rr != null && <> · {detail.rr.toFixed(2)}R avg</>}
            </p>
          </div>
          <span className={`text-2xl font-bold tabular-nums ${detail.pnl > 0 ? "text-profit" : detail.pnl < 0 ? "text-loss" : "text-ink-2"}`}>
            {fmtSignedMoney(detail.pnl, currency)}
          </span>
        </div>

        {/* Branded daily image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={`Daily P&L for ${label}`} className="w-full rounded-lg border border-edge" />

        <div className="mt-3 flex gap-2">
          <a href={src} download={`tradezone-${date}.png`} className="btn-primary text-sm">Download image</a>
          <button className="btn-ghost text-sm" onClick={copyImage}>{copied ? "Copied!" : "Copy image"}</button>
        </div>

        {/* Per-account breakdown */}
        {detail.accounts.length > 1 && (
          <div className="mt-4">
            <p className="field-label">By account</p>
            <div className="space-y-1">
              {detail.accounts.map((a) => (
                <div key={a.name} className="flex items-center justify-between text-sm">
                  <span className="text-ink-2">{a.name} <span className="text-xs text-muted">· {a.count}</span></span>
                  <span className={`font-semibold tabular-nums ${a.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                    {fmtSignedMoney(a.pnl, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per-trade breakdown */}
        <div className="mt-4">
          <p className="field-label">Trades</p>
          <ul className="divide-y divide-edge/60">
            {detail.trades.map((t, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <span className={t.direction === "LONG" ? "badge-long" : "badge-short"}>
                    {t.direction === "LONG" ? "L" : "S"}
                  </span>
                  <span className="font-medium">{t.symbol}</span>
                  {t.account && <span className="text-xs text-muted">{t.account}</span>}
                  <span className="text-xs text-muted">{t.time}</span>
                </span>
                <span className={`font-semibold tabular-nums ${t.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                  {fmtSignedMoney(t.pnl, currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
