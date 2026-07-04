import { prisma } from "@/lib/prisma";
import { toTradeDTO } from "@/lib/dto";
import { JournalClient } from "@/components/JournalClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Journal" };

export default async function JournalPage() {
  const [entries, trades, settings] = await Promise.all([
    prisma.journalEntry.findMany({ orderBy: { date: "desc" } }),
    prisma.trade.findMany({ orderBy: { entryDate: "desc" } }),
    prisma.settings.findUnique({ where: { id: 1 } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Journal</h1>
      <p className="text-sm text-muted">
        Daily notes with mood and discipline ratings, linked to that day&apos;s trades.
      </p>
      <JournalClient
        entries={entries.map((e) => ({
          date: e.date,
          mood: e.mood,
          discipline: e.discipline,
          notes: e.notes,
          lessons: e.lessons,
        }))}
        trades={trades.map(toTradeDTO)}
        currency={settings?.currency ?? "USD"}
      />
    </div>
  );
}
