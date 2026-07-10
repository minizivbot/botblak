/**
 * The prop-trading business ledger. Fees and resets are money paid to the
 * firm; payouts are money pulled back out. This nets it all out so a trader
 * can see whether their prop accounts are actually a business or a hobby.
 */

export type PropTxnLite = { firm: string; kind: string; amount: number };

export type PropFirmRow = {
  firm: string;
  fees: number; // fees + resets paid to this firm
  payouts: number;
  net: number; // payouts - fees
};

export type PropSummary = {
  totalFees: number; // fees + resets across all firms
  totalPayouts: number;
  net: number;
  roi: number | null; // net / totalFees, null when nothing spent yet
  byFirm: PropFirmRow[]; // most profitable firm first
};

export function propSummary(txns: PropTxnLite[]): PropSummary {
  const firms = new Map<string, { fees: number; payouts: number }>();
  let totalFees = 0;
  let totalPayouts = 0;

  for (const t of txns) {
    const amt = Math.abs(t.amount);
    const row = firms.get(t.firm) ?? { fees: 0, payouts: 0 };
    if (t.kind === "payout") {
      row.payouts += amt;
      totalPayouts += amt;
    } else {
      // "fee" and "reset" are both money out.
      row.fees += amt;
      totalFees += amt;
    }
    firms.set(t.firm, row);
  }

  const byFirm: PropFirmRow[] = [...firms.entries()]
    .map(([firm, { fees, payouts }]) => ({ firm, fees, payouts, net: payouts - fees }))
    .sort((a, b) => b.net - a.net);

  const net = totalPayouts - totalFees;
  return { totalFees, totalPayouts, net, roi: totalFees > 0 ? net / totalFees : null, byFirm };
}
