import { dailySpeech, SPEECHES } from "@/lib/motivation";

export const metadata = { title: "ICT Daily Motivation" };
export const dynamic = "force-dynamic";

export default function MotivationPage() {
  const today = new Date();
  const { speech, index } = dailySpeech(today);
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">ICT Daily Motivation</h1>
        <p className="mt-1 text-sm text-muted">
          {dateLabel} · speech {index + 1} of {SPEECHES.length} — a new one every day.
        </p>
      </div>

      {/* Quote hero */}
      <section className="card relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-profit-mark/10"
        />
        <p className="relative text-xs font-semibold tracking-[0.12em] text-accent uppercase">Today&apos;s line</p>
        <blockquote className="relative mt-3 text-xl leading-relaxed font-semibold text-ink sm:text-2xl">
          “{speech.quote}”
        </blockquote>
      </section>

      {/* Speech */}
      <section className="card">
        <h2 className="card-title">{speech.title}</h2>
        <div className="space-y-3 text-[15px] leading-relaxed text-ink-2">
          {speech.speech.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      {/* Focus checklist */}
      <section className="card">
        <h2 className="card-title">Today&apos;s focus</h2>
        <ul className="space-y-2.5">
          {speech.focus.map((f, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-ink-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-accent/40 bg-accent/10 text-xs font-bold text-accent">
                {i + 1}
              </span>
              {f}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-center text-xs text-muted">
        Mark your levels. Keep your killzone. Journal the truth. See you tomorrow.
      </p>
    </div>
  );
}
