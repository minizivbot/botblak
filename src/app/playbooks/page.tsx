import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { PLAYBOOKS } from "@/lib/playbooks";
import { PlaybookCard } from "@/components/PlaybookCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Playbooks" };

export default async function PlaybooksPage() {
  const viewer = await getViewer();
  if (viewer.isDemo) redirect("/login");

  if (!viewer.isPro) {
    return (
      <div className="mx-auto max-w-lg space-y-4 pt-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-3xl">🔒</div>
        <h1 className="text-xl font-bold">Playbooks are a Pro feature</h1>
        <p className="text-sm text-ink-2">
          Six complete ICT setups — Silver Bullet, OTE, Judas Swing, FVG Continuation, Turtle Soup and Power of 3 —
          each taught in 5-10 minutes with a live entry checklist you run during the session, invalidation rules and
          the mistakes that cost real money.
        </p>
        <div className="mx-auto max-w-xs space-y-1.5 text-left text-sm text-ink-2">
          {PLAYBOOKS.map((pb) => (
            <p key={pb.id} className="flex items-center gap-2">
              <span>{pb.emoji}</span>
              <span className="font-medium text-ink">{pb.name}</span>
              <span className="text-xs text-muted">· {pb.readMinutes} min</span>
            </p>
          ))}
        </div>
        <Link href="/pricing" className="btn-primary inline-block">
          See Pro plans
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">
          Playbooks
          <span className="ml-2 rounded-full bg-amber-400/15 px-2 py-0.5 align-middle text-[11px] font-bold text-amber-400">
            PRO
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          Complete ICT setups as executable checklists. Open one during the session and check the boxes live — all
          green means A+ setup, anything missing means no trade. Tag the playbook name on your trades and the Edge
          Report shows which setup actually pays you.
        </p>
      </div>

      <div className="space-y-3">
        {PLAYBOOKS.map((pb) => (
          <PlaybookCard key={pb.id} pb={pb} />
        ))}
      </div>
    </div>
  );
}
