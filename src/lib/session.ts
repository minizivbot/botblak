/**
 * Stateless signed session cookie, edge-safe (Web Crypto only) so the same
 * code runs in middleware and in API routes.
 * Cookie value: "<userId>.<hmacSha256(userId, AUTH_SECRET)>".
 */

export const AUTH_COOKIE = "tradezone_session";

function secret(): string {
  // Set AUTH_SECRET in production (see README). The fallback keeps local dev
  // zero-config; sessions just reset if it changes.
  const s = process.env.AUTH_SECRET;
  if (!s && process.env.NODE_ENV === "production") {
    // Loud warning: without a real secret, sessions can be forged and broker
    // credentials are encrypted with a public key. Set AUTH_SECRET in Vercel.
    console.error("SECURITY: AUTH_SECRET is not set in production — set it in your environment now.");
  }
  return s || "tradezone-dev-secret-change-me";
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionValue(userId: string): Promise<string> {
  return `${userId}.${await hmac(userId)}`;
}

/** Returns the userId if the cookie is validly signed, else null. */
export async function verifySessionValue(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const userId = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = await hmac(userId);
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0 ? userId : null;
}
