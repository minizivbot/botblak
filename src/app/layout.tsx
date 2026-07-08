import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { getViewer } from "@/lib/viewer";
import { getSiteConfig } from "@/lib/siteconfig";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { SupportWidget } from "@/components/SupportWidget";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "TradeZone — Trading Journal", template: "%s — TradeZone" },
  description:
    "Log trades, sync your broker, and see exactly where your edge is. ICT killzones, smart insights, and a daily-loss risk guard.",
  applicationName: "TradeZone",
  keywords: ["trading journal", "ICT", "killzones", "futures", "day trading", "prop firm"],
  openGraph: {
    title: "TradeZone — Trading Journal",
    description:
      "Log trades, sync your broker, and see exactly where your edge is. ICT killzones, smart insights, and a daily-loss risk guard.",
    url: SITE_URL,
    siteName: "TradeZone",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeZone — Trading Journal",
    description: "Log trades, sync your broker, and see exactly where your edge is.",
  },
  appleWebApp: { capable: true, title: "TradeZone", statusBarStyle: "black-translucent" },
  // Google Search Console "HTML tag" verification: set GOOGLE_SITE_VERIFICATION
  // in env vars to the content value Search Console gives you (no code change needed).
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: "#0a0e14",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [viewer, site] = await Promise.all([getViewer(), getSiteConfig()]);
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {!viewer.isDemo && <ServiceWorkerRegister />}
        {site.announcement && <AnnouncementBar text={site.announcement} level={site.announcementLevel} />}
        <div className="flex min-h-screen flex-col md:flex-row">
          <Nav
            username={viewer.username}
            authed={!viewer.isDemo}
            isAdmin={viewer.isAdmin}
            isPro={viewer.isPro}
            showLeaderboard={site.leaderboardEnabled}
          />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
        {!viewer.isDemo && <SupportWidget />}
      </body>
    </html>
  );
}
