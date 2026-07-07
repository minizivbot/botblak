import type { MetadataRoute } from "next";

/** PWA manifest so TradeZone installs to the home screen like a native app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TradeZone — Trading Journal",
    short_name: "TradeZone",
    description: "Log trades, sync your broker, and see exactly where your edge is.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0e14",
    theme_color: "#0a0e14",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
