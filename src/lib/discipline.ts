import { closedTrades, type StatsTrade } from "./stats";
import { killzone } from "./killzones";
import { etDateOf } from "./trading-day";

/**
 * A daily discipline grade (A–F) computed purely from the trades — no manual
 * input. Rewards rule-following: staying in killzones, respecting the loss
 * limit, not overtrading, and not revenge-trading. This turns the journal from
 * a record into a scoreboard for behavior.
 */

export type DayGrade = {
  date: string; // "YYYY-MM-DD" NY
  score: number; // 0..100
  grade: "A" | "B" | "C" | "D" | "F";
  pnl: number;
  trades: number;
  reasons: string[]; // what cost points that day
};

function letter(score: number): DayGrade["grade"] {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/** Grade each NY trading day with closed trades, newest first. */
export function dailyGrades(trades: StatsTrade[], maxDailyLoss: number | null): DayGrade[] {
  const closed = closedTrades(trades);
  const byDay = new Map<string, typeof closed>();
  for (const t of closed) {
    const key = etDateOf(t.closedAt);
    const arr = byDay.get(key) ?? [];
    arr.push(t);
    byDay.set(key, arr);
  }

  const grades: DayGrade[] = [];
  for (const [date, dayTrades] of byDay) {
    // Order within the day by close time so streak/revenge checks make sense.
    const day = [...dayTrades].sort((a, b) => a.closedAt.getTime() - b.closedAt.getTime());
    const pnl = day.reduce((s, t) => s + t.pnl, 0);
    let score = 100;
    const reasons: string[] = [];

    // Overtrading: more than 4 trades in a day.
    if (day.length > 4) {
      const penalty = Math.min(30, (day.length - 4) * 10);
      score -= penalty;
      reasons.push(`Overtraded (${day.length} trades)`);
    }

    // Off-killzone: majority of trades taken outside a killzone.
    const offKz = day.filter((t) => killzone(t.entryDate) === "Off-hours").length;
    if (day.length > 0 && offKz / day.length > 0.5) {
      score -= 15;
      reasons.push("Most trades off-killzone");
    }

    // Revenge trading: re-entering within 30 minutes of a losing close.
    let revenge = 0;
    for (let i = 1; i < day.length; i++) {
      const gap = day[i].entryDate.getTime() - day[i - 1].closedAt.getTime();
      if (day[i - 1].pnl < 0 && gap >= 0 && gap < 30 * 60_000) revenge++;
    }
    if (revenge > 0) {
      score -= Math.min(30, revenge * 15);
      reasons.push(`${revenge} revenge trade${revenge === 1 ? "" : "s"}`);
    }

    // Loss-limit breach: the day's realized loss went past the configured limit.
    if (maxDailyLoss != null && pnl <= -maxDailyLoss) {
      score -= 30;
      reasons.push("Blew past daily loss limit");
    }

    score = Math.max(0, score);
    grades.push({ date, score, grade: letter(score), pnl, trades: day.length, reasons });
  }

  return grades.sort((a, b) => b.date.localeCompare(a.date));
}
