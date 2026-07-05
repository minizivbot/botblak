"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";

const icons: Record<string, React.ReactNode> = {
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
  journal: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <path d="M5 3h9a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M7.5 7h5M7.5 10h5M7.5 13h3" strokeLinecap="round" />
    </svg>
  ),
  import: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <path d="M10 3v9M10 12l-3-3M10 12l3-3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 14v2a1 1 0 001 1h10a1 1 0 001-1v-2" strokeLinecap="round" />
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
  leaderboard: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <path d="M7 16h6M10 13v3M4 4h12v3a6 6 0 01-12 0V4zM4 6H2.5v1a2.5 2.5 0 002.5 2.5M16 6h1.5v1A2.5 2.5 0 0115 9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  accounts: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[18px] w-[18px]">
      <rect x="3" y="5" width="14" height="11" rx="2" />
      <path d="M3 8.5h14M6.5 12.5h3" strokeLinecap="round" />
    </svg>
  ),
};

const links = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/accounts", label: "Accounts", icon: "accounts" },
  { href: "/trades", label: "Trades", icon: "trades" },
  { href: "/journal", label: "Journal", icon: "journal" },
  { href: "/leaderboard", label: "Leaderboard", icon: "leaderboard" },
  { href: "/motivation", label: "Daily Motivation", icon: "motivation" },
  { href: "/learn", label: "Learn", icon: "learn" },
  { href: "/import", label: "Import & Sync", icon: "import" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function Nav({ username, authed }: { username: string | null; authed: boolean }) {
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

  const accountBox = authed ? (
    <div className="rounded-xl border border-edge bg-raised/50 p-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-profit-mark text-sm font-bold text-white">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{username}</p>
          <button onClick={signOut} className="text-xs text-muted transition-colors hover:text-loss">
            Sign out
          </button>
        </div>
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

  const items = links.map((l) => {
    const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
    return (
      <Link
        key={l.href}
        href={l.href}
        onClick={() => setOpen(false)}
        className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          active ? "bg-raised text-ink" : "text-ink-2 hover:bg-raised/60 hover:text-ink"
        }`}
      >
        {active && <span className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent" />}
        <span className={active ? "text-accent" : "text-muted"}>{icons[l.icon]}</span>
        {l.label}
      </Link>
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
