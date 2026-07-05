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
        // Map against normalized columns for presets that rewrite rows.
        const nHeaders = preset.normalize
          ? res.data[0]
            ? Object.keys(preset.normalize(res.data[0]))
            : []
          : hdrs;
        setMapping(autoMap(nHeaders, preset));
      },
      error: (err) => setError(`CSV parse failed: ${err.message}`),
    });
  }

  // Some presets (Tradovate) rewrite each row into canonical columns before
  // mapping. Derive the effective rows/headers the mapping UI works against.
  const normRows = useMemo(
    () => (preset.normalize ? rows.map(preset.normalize) : rows),
    [rows, preset],
  );
  const normHeaders = useMemo(
    () => (preset.normalize ? (normRows[0] ? Object.keys(normRows[0]) : []) : headers),
    [preset, normRows, headers],
  );

  // Re-run auto-mapping when the preset changes on an already-loaded file.
  useEffect(() => {
    if (normHeaders.length) setMapping(autoMap(normHeaders, preset));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetId]);

  const parsed = useMemo(() => normRows.map((r) => rowToTrade(r, mapping)), [normRows, mapping]);
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

      {normHeaders.length > 0 && (
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
                    {normHeaders.map((h) => (
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

type CredField = { key: string; label: string; type?: "text" | "password"; placeholder?: string; optional?: boolean };

type Guide = {
  intro: string;
  sections: { title: string; steps: string[] }[];
  troubleshoot?: { error: string; fix: string }[];
};

/** Step-by-step "where do I get these credentials?" guides, shown on the site. */
const BROKER_GUIDES: Record<string, Guide> = {
  alpaca: {
    intro: "Free stock paper-trading API — great for practicing with US stocks.",
    sections: [
      {
        title: "Get your keys",
        steps: [
          "Go to alpaca.markets and create a free account.",
          "Open the dashboard and switch to \"Paper Trading\" (toggle at the top-left).",
          "In the right sidebar find \"API Keys\" and press \"Generate\".",
          "Copy the Key ID and the Secret Key and paste them here, then press Verify & connect.",
          "From now on, one tap on \"Sync now\" pulls all your filled orders into the journal.",
        ],
      },
    ],
  },
  tradovate: {
    intro:
      "Futures broker for ES, NQ, MES, MNQ, gold, oil and more. Important: Tradovate's API only works for a registered app with API Access — a paid add-on most PROP FIRMS BLOCK. If live sync fails with \"app is not registered\", that's why. The CSV import above always works: in Tradovate go to Performance → export, then pick the \"Tradovate (Performance export)\" preset here.",
    sections: [
      {
        title: "Option A — username & password (most personal accounts)",
        steps: [
          "In the Username field, type the exact username you use to log in to the Tradovate app or trader.tradovate.com.",
          "In Password, type that same login password.",
          "In Environment, type \"live\" if this is a funded/real account, or \"demo\" if it's a simulation account. Not sure? Leave it — we automatically try both and keep whichever one logs in.",
          "Press \"Verify & connect\". We sign in to Tradovate once to confirm the details, then store them encrypted.",
          "Press \"Sync now\" — your fills are pulled, paired into round-trip trades, and priced with real point values (ES $50/pt, MES $5/pt, NQ $20/pt, MNQ $2/pt…).",
        ],
      },
      {
        title: "Option B — API key (funded / prop accounts, or if Option A is blocked)",
        steps: [
          "Log in at trader.tradovate.com on a computer.",
          "Open the top-right menu → \"Application Settings\" (or \"API Access\" on some layouts).",
          "Find \"API Access\" and request/enable it. Some prop firms require you to enable this once; it's usually free.",
          "Create an API application / key. Tradovate gives you a Client ID (a number, the \"cid\") and a Client Secret (the \"sec\").",
          "Come back here and fill Username, Password, Environment (usually \"live\" for funded), AND paste the cid and sec into the two optional API fields.",
          "Press \"Verify & connect\", then \"Sync now\".",
        ],
      },
      {
        title: "Prop firms (Apex, TakeProfit, MyFundedFutures, Tradeify…)",
        steps: [
          "These run on top of Tradovate, so the same username/password usually works — set Environment to \"live\".",
          "If login is rejected, the firm may gate API access. Enable it in Application Settings (Option B), or ask the firm's support to turn on Tradovate API access.",
          "If the firm blocks API access entirely (some do), no app can connect with a password — use the CSV import above instead. It's 30 seconds and always works.",
        ],
      },
    ],
    troubleshoot: [
      { error: "\"login failed\" / \"Check the username and password\"", fix: "Wrong username, password, or environment. Try Environment = \"live\" (funded) or \"demo\" (sim). Confirm the exact login works at trader.tradovate.com first." },
      { error: "\"API access required\" / 403 / \"not authorized\"", fix: "Your account needs API access enabled. Follow Option B to generate a cid + sec, or ask your prop firm to enable it. If they refuse, use CSV import." },
      { error: "\"rate-limiting or captcha\" / p-ticket", fix: "Tradovate throttles repeated logins. Wait a minute and press Verify & connect again." },
    ],
  },
};

function TradingViewCard() {
  return (
    <div className="rounded-xl border border-edge bg-raised/40 p-3">
      <p className="text-sm font-semibold">TradingView</p>
      <p className="mt-1 text-xs text-muted">○ No API — use CSV import instead</p>
      <div className="mt-2 space-y-1.5 text-sm text-ink-2">
        <p>
          TradingView doesn&apos;t offer an API for reading your trade history, so no app can connect to it with a
          password. The good news: exporting takes 30 seconds —
        </p>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          <li>Open the chart → Trading Panel → your paper-trading account.</li>
          <li>Go to the <span className="text-ink">History</span> tab, right-click the table → <span className="text-ink">Export data</span> (CSV).</li>
          <li>Come back here, choose the <span className="text-ink">Generic CSV</span> preset in the CSV import above, pick the file, and map the columns.</li>
        </ol>
      </div>
    </div>
  );
}
type BrokerConn = {
  id: string;
  label: string;
  fields: CredField[];
  connected: boolean;
  envFallback: boolean;
};

function BrokerSync() {
  const [brokerList, setBrokerList] = useState<BrokerConn[] | null>(null);
  const [openForm, setOpenForm] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, { ok: boolean; text: string }>>({});

  const load = () =>
    fetch("/api/broker-connections")
      .then((r) => r.json())
      .then((b) => setBrokerList(b.brokers ?? []))
      .catch(() => setBrokerList([]));

  useEffect(() => {
    load();
  }, []);

  const say = (id: string, ok: boolean, text: string) => setMessages((m) => ({ ...m, [id]: { ok, text } }));

  async function connect(b: BrokerConn) {
    setBusy(`connect-${b.id}`);
    try {
      const res = await fetch("/api/broker-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ broker: b.id, credentials: formValues }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Connection failed");
      say(b.id, true, "Connected! Credentials verified with the broker and stored encrypted.");
      setOpenForm(null);
      setFormValues({});
      await load();
    } catch (e) {
      say(b.id, false, e instanceof Error ? e.message : "Connection failed");
    } finally {
      setBusy(null);
    }
  }

  async function disconnect(b: BrokerConn) {
    if (!confirm(`Disconnect ${b.label}?`)) return;
    await fetch(`/api/broker-connections?broker=${b.id}`, { method: "DELETE" }).catch(() => null);
    say(b.id, true, "Disconnected — your credentials were deleted.");
    await load();
  }

  async function sync(id: string) {
    setBusy(`sync-${id}`);
    try {
      const res = await fetch(`/api/sync/${id}`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Sync failed (HTTP ${res.status})`);
      say(id, true, `Imported ${body.imported}, skipped ${body.skipped} already-synced. ${body.detail ?? ""}`);
    } catch (e) {
      say(id, false, e instanceof Error ? e.message : "Sync failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="card space-y-4">
      <div>
        <h2 className="text-base font-semibold">Broker sync</h2>
        <p className="mt-1 text-sm text-muted">
          Connect your broker right here — credentials are <span className="text-ink-2">verified with the broker</span>,
          stored <span className="text-ink-2">encrypted</span>, visible to no one, and used only to pull your fills.
        </p>
      </div>

      {brokerList === null && <p className="text-sm text-muted">Checking brokers…</p>}

      {brokerList?.map((b) => {
        const usable = b.connected || b.envFallback;
        return (
          <div key={b.id} className="rounded-xl border border-edge bg-raised/40 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{b.label}</p>
                <p className={`text-xs ${usable ? "text-profit" : "text-muted"}`}>
                  {b.connected
                    ? "● Connected with your credentials"
                    : b.envFallback
                      ? "● Server credentials available"
                      : "○ Not connected"}
                </p>
              </div>
              <div className="flex gap-2">
                {b.connected ? (
                  <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => disconnect(b)}>
                    Disconnect
                  </button>
                ) : (
                  <button
                    className="btn-ghost px-3 py-1.5 text-xs"
                    onClick={() => {
                      setOpenForm(openForm === b.id ? null : b.id);
                      setFormValues({});
                    }}
                  >
                    {openForm === b.id ? "Cancel" : "Connect"}
                  </button>
                )}
                <button className="btn-primary" onClick={() => sync(b.id)} disabled={!usable || busy === `sync-${b.id}`}>
                  {busy === `sync-${b.id}` ? "Syncing…" : "Sync now"}
                </button>
              </div>
            </div>

            {BROKER_GUIDES[b.id] && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-medium text-accent hover:underline">
                  How do I connect this? Step-by-step guide
                </summary>
                <div className="mt-2 space-y-3 rounded-lg border border-edge bg-surface/60 p-3">
                  <p className="text-sm text-ink-2">{BROKER_GUIDES[b.id].intro}</p>
                  {BROKER_GUIDES[b.id].sections.map((sec, si) => (
                    <div key={si}>
                      <p className="text-xs font-semibold tracking-wide text-ink uppercase">{sec.title}</p>
                      <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-ink-2">
                        {sec.steps.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ol>
                    </div>
                  ))}
                  {BROKER_GUIDES[b.id].troubleshoot && (
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-ink uppercase">If it won&apos;t connect</p>
                      <ul className="mt-1 space-y-1.5 text-sm text-ink-2">
                        {BROKER_GUIDES[b.id].troubleshoot!.map((t, i) => (
                          <li key={i}>
                            <span className="text-loss">{t.error}</span> — {t.fix}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </details>
            )}

            {openForm === b.id && (
              <form
                className="mt-3 space-y-2 border-t border-edge pt-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  connect(b);
                }}
              >
                {b.fields.map((f) => (
                  <div key={f.key}>
                    <label className="field-label">
                      {f.label}
                      {!f.optional && <span className="text-loss"> *</span>}
                    </label>
                    <input
                      className="field"
                      type={f.type ?? "text"}
                      placeholder={f.placeholder}
                      required={!f.optional}
                      value={formValues[f.key] ?? ""}
                      onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      autoComplete="off"
                    />
                  </div>
                ))}
                <button className="btn-primary w-full" type="submit" disabled={busy === `connect-${b.id}`}>
                  {busy === `connect-${b.id}` ? "Verifying with the broker…" : "Verify & connect"}
                </button>
              </form>
            )}

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
        );
      })}

      <TradingViewCard />
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
