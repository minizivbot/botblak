import { prisma } from "./prisma";
import { requireUserId } from "./auth";

function envList(name: string): string[] {
  return (process.env[name] || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * True if the user is an admin: the DB isAdmin flag, or a username in
 * ADMIN_USERNAMES, or an email in ADMIN_EMAILS (handy for Google sign-in).
 */
export async function isUserAdmin(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, email: true, isAdmin: true },
  });
  if (!user) return false;
  if (user.isAdmin) return true;
  if (envList("ADMIN_USERNAMES").includes(user.username.toLowerCase())) return true;
  if (user.email && envList("ADMIN_EMAILS").includes(user.email.toLowerCase())) return true;
  return false;
}

/** Returns the admin's userId, or null if the caller isn't an admin. */
export async function requireAdmin(): Promise<string | null> {
  const userId = await requireUserId();
  return (await isUserAdmin(userId)) ? userId : null;
}
