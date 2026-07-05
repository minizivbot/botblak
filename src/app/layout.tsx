import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { getViewer } from "@/lib/viewer";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mytradezone.vercel.app";

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
};

export const viewport: Viewport = {
  themeColor: "#0a0e14",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="flex min-h-screen flex-col md:flex-row">
          <Nav username={viewer.username} authed={!viewer.isDemo} />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
