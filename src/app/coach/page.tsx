import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { aiConfigured } from "@/lib/ai";
import { CoachClient } from "@/components/CoachClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI Coach" };

export default async function CoachPage() {
  const viewer = await getViewer();
  if (viewer.isDemo || !viewer.userId) redirect("/login");

  if (!viewer.isPro) {
    return (
      <div className="mx-auto max-w-lg space-y-4 pt-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-3xl">🧠</div>
        <h1 className="text-xl font-bold">The AI Coach is a Pro feature</h1>
        <p className="text-sm text-ink-2">
          A personal coach that actually reads your trades. It analyzes your last 30 days — killzones, streaks,
          revenge patterns, your real edge — and gives you a straight-talking review with the one change that matters
          most this week. Like having a mentor who watched every single trade.
        </p>
        <Link href="/pricing" className="btn-primary inline-block">
          See Pro plans
        </Link>
      </div>
    );
  }

  const reports = await prisma.aiReport.findMany({
    where: { userId: viewer.userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, body: true, createdAt: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">
          AI Coach 🧠
          <span className="ml-2 rounded-full bg-amber-400/15 px-2 py-0.5 align-middle text-[11px] font-bold text-amber-400">
            PRO
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          Straight-talking reviews of your actual trading — powered by Claude, grounded in your numbers.
        </p>
      </div>

      <CoachClient
        initialReports={reports.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
        configured={aiConfigured()}
      />
    </div>
  );
}
