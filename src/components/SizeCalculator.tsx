"use client";

import { useState } from "react";

/** Common futures contracts and their dollars-per-point. */
const CONTRACTS = [
  { sym: "MES", name: "Micro S&P", perPoint: 5 },
  { sym: "ES", name: "S&P 500", perPoint: 50 },
  { sym: "MNQ", name: "Micro Nasdaq", perPoint: 2 },
  { sym: "NQ", name: "Nasdaq", perPoint: 20 },
  { sym: "MGC", name: "Micro Gold", perPoint: 10 },
  { sym: "GC", name: "Gold", perPoint: 100 },
  { sym: "CL", name: "Crude Oil", perPoint: 1000 },
];

/** Risk → contracts: how many contracts fit your stop without blowing the risk budget. */
export function SizeCalculator() {
  const [risk, setRisk] = useState("100");
  const [stop, setStop] = useState("10");
  const [sym, setSym] = useState("MES");

  const contract = CONTRACTS.find((c) => c.sym === sym)!;
  const riskNum = Number(risk) || 0;
  const stopNum = Number(stop) || 0;
  const perContract = stopNum * contract.perPoint;
  const contracts = perContract > 0 ? Math.floor(riskNum / perContract) : 0;
  const actualRisk = contracts * perContract;

  return (
    <div className="card space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Position size</h2>
        <p className="text-xs text-muted">Risk ÷ (stop × $/point) — never size by feel.</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="field-label">Risk $</label>
          <input className="field" value={risk} onChange={(e) => setRisk(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" />
        </div>
        <div>
          <label className="field-label">Stop (points)</label>
          <input className="field" value={stop} onChange={(e) => setStop(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" />
        </div>
        <div>
          <label className="field-label">Contract</label>
          <select className="field" value={sym} onChange={(e) => setSym(e.target.value)}>
            {CONTRACTS.map((c) => (
              <option key={c.sym} value={c.sym}>
                {c.sym} (${c.perPoint}/pt)
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className={`rounded-xl border px-3 py-2.5 text-center ${
          contracts > 0 ? "border-accent/40 bg-accent/10" : "border-loss/40 bg-loss/10"
        }`}
      >
        {contracts > 0 ? (
          <>
            <p className="text-2xl font-bold text-ink">
              {contracts} <span className="text-sm font-semibold text-ink-2">× {sym}</span>
            </p>
            <p className="text-xs text-muted">
              = ${actualRisk.toFixed(0)} at risk ({stopNum} pts × ${contract.perPoint}/pt each)
              {contracts > 0 && riskNum - actualRisk > 0.5 ? ` · $${(riskNum - actualRisk).toFixed(0)} spare` : ""}
            </p>
          </>
        ) : (
          <p className="text-sm font-semibold text-loss">
            Stop too wide for this risk — 1 contract = ${perContract.toFixed(0)}. Tighten the stop or trade the micro.
          </p>
        )}
      </div>
    </div>
  );
}
