"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";

const icons: Record<string, React.ReactNode> = {
  today: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4" strokeLinecap="round" />
    </svg>
  ),
  dashboard: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <path d="M3 11l4-6 4 4 3-5 3 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 16h14" strokeLinecap="round" />
    </svg>
  ),
  trades: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <path d="M6 4v12M6 4L3.5 6.5M6 4l2.5 2.5M14 16V4M14 16l-2.5-2.5M14 16l2.5-2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 3v2M10 15v2M3 10h2M15 10h2M5.2 5.2l1.4 1.4M13.4 13.4l1.4 1.4M14.8 5.2l-1.4 1.4M6.6 13.4l-1.4 1.4" strokeLinecap="round" />
    </svg>
  ),
  motivation: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <path d="M10 2.5c1.5 2.5 4.5 4 4.5 8a4.5 4.5 0 01-9 0c0-1.8.8-3.2 1.8-4.6.5.9 1.2 1.5 1.2 1.5C8.5 5.5 9.4 4 10 2.5z" strokeLinejoin="round" />
    </svg>
  ),
  learn: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <path d="M10 4.5C8.5 3.5 6.5 3 4 3v13c2.5 0 4.5.5 6 1.5 1.5-1 3.5-1.5 6-1.5V3c-2.5 0-4.5.5-6 1.5z" strokeLinejoin="round" />
      <path d="M10 4.5v13" strokeLinecap="round" />
    </svg>
  ),
  accounts: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <rect x="3" y="5" width="14" height="11" rx="2" />
      <path d="M3 8.5h14M6.5 12.5h3" strokeLinecap="round" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <rect x="3" y="4.5" width="14" height="12" rx="2" />
      <path d="M3 8h14M7 2.5v3M13 2.5v3M6.5 11h2M11.5 11h2M6.5 13.8h2" strokeLinecap="round" />
    </svg>
  ),
  trophy: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <path d="M7 16.5h6M10 13.5v3M5.5 3.5h9v4a4.5 4.5 0 01-9 0v-4zM5.5 5.5H3.5v1A2.5 2.5 0 006 9M14.5 5.5h2v1A2.5 2.5 0 0114 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  coach: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <path d="M10 3a5.5 5.5 0 015.5 5.5c0 2-1 3.4-2.2 4.4-.5.4-.8 1-.8 1.6v.5a1.5 1.5 0 01-1.5 1.5h-2a1.5 1.5 0 01-1.5-1.5v-.5c0-.6-.3-1.2-.8-1.6C5.5 11.9 4.5 10.5 4.5 8.5A5.5 5.5 0 0110 3z" strokeLinejoin="round" />
      <path d="M8.5 8l1.5 1.5L12 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  crew: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <circle cx="7" cy="7.5" r="2.5" />
      <circle cx="13.5" cy="8.5" r="2" />
      <path d="M3 16c.5-2.5 2-4 4-4s3.5 1.5 4 4M11.5 16c.3-1.8 1-3 2-3.5 1.5-.6 3 .5 3.5 3" strokeLinecap="round" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <path d="M10 2.5l6 2.5v4c0 3.5-2.5 6.3-6 7.5-3.5-1.2-6-4-6-7.5V5l6-2.5z" strokeLinejoin="round" />
      <path d="M7.5 10l1.8 1.8L13 8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  prop: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <path d="M4 8l6-4 6 4M5 8v7h10V8M8 15v-3h4v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  pro: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <path d="M10 2.8l2.1 4.4 4.9.6-3.6 3.3.9 4.8L10 13.6l-4.3 2.3.9-4.8L3 7.8l4.9-.6L10 2.8z" strokeLinejoin="round" />
    </svg>
  ),
};

const links = [
  { href: "/", label: "Today", icon: "today", section: "Trade" },
  { href: "/trades", label: "Trades", icon: "trades", section: "Trade" },
  { href: "/review", label: "Review", icon: "dashboard", section: "Trade" },
  { href: "/calendar", label: "Calendar", icon: "calendar", section: "Trade" },
  { href: "/accounts", label: "Business", icon: "accounts", section: "Business" },
  { href: "/prop-firms", label: "Prop Firms", icon: "prop", section: "Business" },
  { href: "/coach", label: "AI Coach", icon: "coach", pro: true, section: "Grow" },
  { href: "/crew", label: "Crew", icon: "crew", section: "Grow" },
  { href: "/achievements", label: "Achievements", icon: "trophy", section: "Grow" },
  { href: "/motivation", label: "Motivation", icon: "motivation", section: "Grow" },
  { href: "/learn", label: "Learn", icon: "learn", section: "Grow" },
];

export function Nav({
  username,
  authed,
  isAdmin = false,
  isPro = false,
  showPropFirms = true,
  showCoach = false,
}: {
  username: string | null;
  authed: boolean;
  isAdmin?: boolean;
  isPro?: boolean;
  showPropFirms?: boolean;
  showCoach?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/login");
    router.refresh();
  }

  if (pathname === "/login" || pathname === "/register") return null;

  const initial = (username?.[0] ?? "?").toUpperCase();
  let navLinks: { href: string; label: string; icon: string; pro?: boolean; section?: string }[] = links.filter(
    (l) => (showPropFirms || l.href !== "/prop-firms") && (showCoach || l.href !== "/coach"),
  );
  if (!isPro) navLinks = [...navLinks, { href: "/pricing", label: "Go Pro", icon: "pro", pro: true, section: "Grow" }];
  if (isAdmin) navLinks = [...navLinks, { href: "/admin", label: "Admin", icon: "admin", section: "Grow" }];

  const accountBox = authed ? (
    <div className="rounded-xl border border-edge bg-raised/50 p-3">
      <div className="flex items-center gap-2.5">
        <Link
          href="/settings"
          onClick={() => setOpen(false)}
          title="Settings"
          className="group flex min-w-0 flex-1 items-center gap-2.5"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-profit-mark text-sm font-bold text-white">
            {initial}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink group-hover:text-accent">
              {username}
              {isPro && (
                <span className="rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">PRO</span>
              )}
            </span>
            <span className="block text-xs text-muted group-hover:text-ink-2">Settings</span>
          </span>
        </Link>
        <button onClick={signOut} title="Sign out" aria-label="Sign out" className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-raised hover:text-loss">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
            <path d="M12.5 6.5V4.75A1.75 1.75 0 0010.75 3h-5A1.75 1.75 0 004 4.75v10.5C4 16.22 4.78 17 5.75 17h5a1.75 1.75 0 001.75-1.75V13.5M8 10h9M17 10l-2.5-2.5M17 10l-2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  ) : (
    <div className="space-y-2 rounded-xl border border-accent/30 bg-accent/5 p-3">
      <p className="text-xs text-ink-2">You&apos;re viewing a live demo.</p>
      <Link
        href="/login"
        onClick={() => setOpen(false)}
        className="btn-primary block w-full text-center text-sm"
      >
        Sign in
      </Link>
      <Link
        href="/register"
        onClick={() => setOpen(false)}
        className="block w-full text-center text-xs text-accent hover:underline"
      >
        Create free account
      </Link>
    </div>
  );

  const items = navLinks.map((l, i) => {
    const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
    const sectionStart = l.section && navLinks[i - 1]?.section !== l.section;
    return (
      <div key={l.href}>
        {sectionStart && (
          <p className={`px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] text-muted uppercase ${i === 0 ? "pt-0" : "pt-4"}`}>
            {l.section}
          </p>
        )}
        <Link
          href={l.href}
          onClick={() => setOpen(false)}
          className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            active ? "bg-raised text-ink" : "text-ink-2 hover:bg-raised/60 hover:text-ink"
          }`}
        >
          {active && <span className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent" />}
          <span className={active ? "text-accent" : "text-muted"}>{icons[l.icon]}</span>
          {l.label}
          {l.pro && !isPro && (
            <span className="ml-auto rounded-full bg-gradient-to-r from-amber-500/20 to-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
              PRO
            </span>
          )}
        </Link>
      </div>
    );
  });

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-edge bg-surface/90 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/"><Logo /></Link>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={open}
          className="rounded-lg border border-edge px-3 py-1.5 text-sm text-ink-2"
        >
          {open ? "Close" : "Menu"}
        </button>
      </header>
      {open && (
        <nav className="space-y-1 border-b border-edge bg-surface p-3 md:hidden">
          {items}
          <div className="pt-2">{accountBox}</div>
        </nav>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-edge bg-surface/60 p-4 backdrop-blur md:flex">
        <Link href="/" className="mb-8 px-2 pt-1"><Logo /></Link>
        <nav className="space-y-1">{items}</nav>
        <div className="mt-auto">{accountBox}</div>
      </aside>
    </>
  );
}
