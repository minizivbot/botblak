"use client";

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import Link from "next/link";
import {
  CSV_PRESETS,
  TRADE_FIELDS,
  FIELD_LABELS,
  REQUIRED_FIELDS,
  autoMap,
  rowToTrade,
  type TradeField,
} from "@/lib/csv";

type Broker = { id: string; label: string; configured: boolean };

/* ---------------- CSV import ---------------- */

function CsvImport() {
  const [presetId, setPresetId] = useState("generic");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Partial<Record<TradeField, string>>>({});
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const preset = CSV_PRESETS.find((p) => p.id === presetId)!;

  function handleFile(file: File | undefined) {
    setError(null);
    setResult(null);
    if (!file) return;
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h, i) => {
        // Disambiguate duplicate headers (MT statements repeat "Price"/"Time").
        return h.trim();
      },
      complete: (res) => {
        const hdrs = (res.meta.fields ?? []).filter(Boolean);
        if (!hdrs.length || !res.data.length) {
          setError("Could not read any rows from that file. Is it a CSV with a header row?");
          return;
        }
        setHeaders(hdrs);
        setRows(res.data);
        setMapping(autoMap(hdrs, preset));
      },
      error: (err) => setError(`CSV parse failed: ${err.message}`),
    });
  }

  // Re-run auto-mapping when the preset changes on an already-loaded file.
  useEffect(() => {
    if (headers.length) setMapping(autoMap(headers, CSV_PRESETS.find((p) => p.id === presetId)!));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetId]);

  const parsed = useMemo(() => rows.map((r) => rowToTrade(r, mapping)), [rows, mapping]);
  const good = parsed.filter((p) => p.ok);
  const bad = parsed.filter((p) => !p.ok);
  const missingRequired = REQUIRED_FIELDS.filter((f) => !mapping[f]);

  async function doImport() {
    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/import/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "csv", trades: good.map((g) => g.trade) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Import failed");
      setResult(
        `Imported ${body.imported} trade${body.imported === 1 ? "" : "s"}` +
          (body.skipped ? `, skipped ${body.skipped} duplicate${body.skipped === 1 ? "" : "s"}` : "") +
          ".",
      );
      setRows([]);
      setHeaders([]);
      setFileName(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="card space-y-4">
      <div>
        <h2 className="text-base font-semibold">CSV import</h2>
        <p className="mt-1 text-sm text-muted">
          Import trade history exported from MetaTrader 4/5, or any CSV using manual column mapping.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="field-label" htmlFor="csv-preset">Format preset</label>
          <select id="csv-preset" className="field w-auto" value={presetId} onChange={(e) => setPresetId(e.target.value)}>
            {CSV_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="csv-file">CSV file</label>
          <input id="csv-file" type="file" accept=".csv,text/csv" className="field" onChange={(e) => handleFile(e.target.files?.[0])} />
        </div>
      </div>
      <p className="text-xs text-muted">{preset.description}</p>

      {headers.length > 0 && (
        <>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink-2">
              Column mapping <span className="font-normal text-muted">({fileName})</span>
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {TRADE_FIELDS.map((f) => (
                <div key={f}>
                  <label className="field-label">
                    {FIELD_LABELS[f]}
                    {REQUIRED_FIELDS.includes(f) && <span className="text-loss"> *</span>}
                  </label>
                  <select
                    className="field"
                    value={mapping[f] ?? ""}
                    onChange={(e) => setMapping((m) => ({ ...m, [f]: e.target.value || undefined }))}
                  >
                    <option value="">— not mapped —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {missingRequired.length > 0 ? (
            <p className="rounded-lg border border-loss/40 bg-loss/10 px-3 py-2 text-sm text-loss">
              Map the required columns first: {missingRequired.map((f) => FIELD_LABELS[f]).join(", ")}.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-ink-2">
                <span className="font-medium text-profit">{good.length}</span> rows ready to import
                {bad.length > 0 && (
                  <>
                    {" · "}
                    <span className="text-muted">{bad.length} rows skipped (balance rows, bad values…)</span>
                  </>
                )}
              </p>
              {good.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-edge">
                  <table className="w-full min-w-[560px] text-xs">
                    <thead>
                      <tr className="border-b border-edge text-left text-muted">
                        <th className="px-3 py-2 font-medium">Symbol</th>
                        <th className="px-3 py-2 font-medium">Side</th>
                        <th className="px-3 py-2 font-medium">Entry</th>
                        <th className="px-3 py-2 font-medium">Exit</th>
                        <th className="px-3 py-2 font-medium">Size</th>
                        <th className="px-3 py-2 font-medium">Entry date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {good.slice(0, 5).map((g, i) => (
                        <tr key={i} className="border-b border-edge/50 last:border-0">
                          <td className="px-3 py-1.5 font-medium">{g.trade!.symbol}</td>
                          <td className="px-3 py-1.5">{g.trade!.direction}</td>
                          <td className="px-3 py-1.5">{g.trade!.entryPrice}</td>
                          <td className="px-3 py-1.5">{g.trade!.exitPrice ?? "open"}</td>
                          <td className="px-3 py-1.5">{g.trade!.size}</td>
                          <td className="px-3 py-1.5">{g.trade!.entryDate.slice(0, 16).replace("T", " ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {good.length > 5 && (
                    <p className="border-t border-edge px-3 py-1.5 text-xs text-muted">…and {good.length - 5} more</p>
                  )}
                </div>
              )}
              <button className="btn-primary" onClick={doImport} disabled={importing || good.length === 0}>
                {importing ? "Importing…" : `Import ${good.length} trades`}
              </button>
            </div>
          )}
        </>
      )}

      {error && <p className="rounded-lg border border-loss/40 bg-loss/10 px-3 py-2 text-sm text-loss">{error}</p>}
      {result && (
        <p className="rounded-lg border border-profit/40 bg-profit/10 px-3 py-2 text-sm text-profit">
          {result} <Link href="/trades" className="underline">View trades →</Link>
        </p>
      )}
    </section>
  );
}

/* ---------------- Broker API sync ---------------- */

function BrokerSync() {
  const [brokerList, setBrokerList] = useState<Broker[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, { ok: boolean; text: string }>>({});

  useEffect(() => {
    fetch("/api/sync/status")
      .then((r) => r.json())
      .then((b) => setBrokerList(b.brokers ?? []))
      .catch(() => setBrokerList([]));
  }, []);

  async function sync(id: string) {
    setBusy(id);
    setMessages((m) => ({ ...m, [id]: undefined as never }));
    try {
      const res = await fetch(`/api/sync/${id}`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Sync failed (HTTP ${res.status})`);
      setMessages((m) => ({
        ...m,
        [id]: {
          ok: true,
          text: `Imported ${body.imported}, skipped ${body.skipped} already-synced. ${body.detail ?? ""}`,
        },
      }));
    } catch (e) {
      setMessages((m) => ({ ...m, [id]: { ok: false, text: e instanceof Error ? e.message : "Sync failed" } }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="card space-y-4">
      <div>
        <h2 className="text-base font-semibold">Broker API sync</h2>
        <p className="mt-1 text-sm text-muted">
          Pull filled orders straight from your broker. Keys live in <code className="text-ink-2">.env</code> on the
          server — see the README for setup. New brokers plug in via the adapter interface in{" "}
          <code className="text-ink-2">src/lib/brokers</code>.
        </p>
      </div>

      {brokerList === null && <p className="text-sm text-muted">Checking configured brokers…</p>}
      {brokerList?.length === 0 && <p className="text-sm text-muted">No broker adapters registered.</p>}

      {brokerList?.map((b) => (
        <div key={b.id} className="rounded-lg border border-edge bg-raised/40 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{b.label}</p>
              <p className={`text-xs ${b.configured ? "text-profit" : "text-muted"}`}>
                {b.configured ? "● API keys configured" : "○ API keys not set — add them to .env"}
              </p>
            </div>
            <button className="btn-primary" onClick={() => sync(b.id)} disabled={!b.configured || busy === b.id}>
              {busy === b.id ? "Syncing…" : "Sync now"}
            </button>
          </div>
          {messages[b.id] && (
            <p
              className={`mt-2 rounded-lg border px-3 py-2 text-sm ${
                messages[b.id].ok
                  ? "border-profit/40 bg-profit/10 text-profit"
                  : "border-loss/40 bg-loss/10 text-loss"
              }`}
            >
              {messages[b.id].text}
            </p>
          )}
        </div>
      ))}
    </section>
  );
}

export function ImportClient() {
  return (
    <div className="space-y-4">
      <CsvImport />
      <BrokerSync />
    </div>
  );
}
