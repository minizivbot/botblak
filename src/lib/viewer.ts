import { prisma } from "./prisma";
import { requireUserId } from "./auth";

export type Viewer = {
  /** The user whose data to render — the signed-in user, or the demo user for guests. */
  userId: string | null;
  /** Signed-in username, or null for guests. */
  username: string | null;
  /** True when showing the public demo to a logged-out visitor. */
  isDemo: boolean;
};

/**
 * Resolve who we're rendering for. Signed-in users see their own data; guests
 * see the "demo" account read-only so the app is a live showcase before login.
 */
export async function getViewer(): Promise<Viewer> {
  const userId = await requireUserId();
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    return { userId, username: user?.username ?? null, isDemo: false };
  }
  const demo = await prisma.user.findUnique({ where: { username: "demo" }, select: { id: true } });
  return { userId: demo?.id ?? null, username: null, isDemo: true };
}
