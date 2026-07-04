import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { prisma } from "./prisma";
import { AUTH_COOKIE, verifySessionValue } from "./session";

export { AUTH_COOKIE, createSessionValue } from "./session";

/* ---------- password hashing (scrypt, no extra deps) ---------- */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

/* ---------- current user helpers (server only) ---------- */

/** userId from the session cookie, or null. Signature check only (no DB hit). */
export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  return verifySessionValue(store.get(AUTH_COOKIE)?.value);
}

/** userId verified against the database — use in API routes and pages. */
export async function requireUserId(): Promise<string | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  return user?.id ?? null;
}
