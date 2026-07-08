import { prisma } from "./prisma";

export type SiteConfig = {
  announcement: string | null;
  announcementLevel: string;
  registrationOpen: boolean;
  propFirmsEnabled: boolean;
};

const DEFAULTS: SiteConfig = {
  announcement: null,
  announcementLevel: "info",
  registrationOpen: true,
  propFirmsEnabled: true,
};

/** The single site-wide config row, created lazily with defaults. */
export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const row = await prisma.siteConfig.findUnique({ where: { id: "singleton" } });
    if (!row) return DEFAULTS;
    return {
      announcement: row.announcement,
      announcementLevel: row.announcementLevel,
      registrationOpen: row.registrationOpen,
      propFirmsEnabled: row.propFirmsEnabled,
    };
  } catch {
    // If the table isn't migrated yet, fall back to safe defaults.
    return DEFAULTS;
  }
}
