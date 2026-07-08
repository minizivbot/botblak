import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
          the mistakes that cost real money. Plus a curated video-lesson library on the same concepts.
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

  const videos = await prisma.videoLesson.findMany({
    where: { enabled: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const categories = [...new Set(videos.map((v) => v.category))];

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

      {videos.length > 0 && (
        <section className="space-y-4 pt-4">
          <div>
            <h2 className="text-lg font-semibold">Video lessons 🎬</h2>
            <p className="mt-1 text-sm text-muted">
              Hand-picked lessons on the concepts above, straight from the source. Watch one, then run its playbook
              checklist on the next session.
            </p>
          </div>
          {categories.map((cat) => (
            <div key={cat} className="space-y-2">
              <h3 className="text-xs font-bold tracking-wide text-muted uppercase">{cat}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {videos
                  .filter((v) => v.category === cat)
                  .map((v) => (
                    <div key={v.id} className="card space-y-2 p-3">
                      <div className="aspect-video overflow-hidden rounded-lg bg-black">
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
                          title={v.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                          className="h-full w-full"
                        />
                      </div>
                      <p className="text-sm font-medium text-ink">
                        {v.title}
                        {v.minutes ? <span className="ml-1.5 text-xs font-normal text-muted">· {v.minutes} min</span> : null}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {videos.length === 0 && viewer.isAdmin && (
        <p className="rounded-xl border border-dashed border-edge px-4 py-3 text-sm text-muted">
          🎬 Admin tip: add YouTube lessons from the admin panel and they&apos;ll show up here for Pro users.
        </p>
      )}
    </div>
  );
}
