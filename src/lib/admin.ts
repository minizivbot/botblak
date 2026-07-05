import { prisma } from "./prisma";
import { requireUserId } from "./auth";

/** Usernames listed in ADMIN_USERNAMES (comma-separated) are always admins. */
function envAdmins(): string[] {
  return (process.env.ADMIN_USERNAMES || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** True if the given user is an admin (DB flag or ADMIN_USERNAMES env). */
export async function isUserAdmin(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true, isAdmin: true } });
  if (!user) return false;
  return user.isAdmin || envAdmins().includes(user.username.toLowerCase());
}

/** Returns the admin's userId, or null if the caller isn't an admin. */
export async function requireAdmin(): Promise<string | null> {
  const userId = await requireUserId();
  return (await isUserAdmin(userId)) ? userId : null;
}
