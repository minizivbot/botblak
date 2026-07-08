import { NextRequest } from "next/server";

/**
 * Only Vercel's cron scheduler may hit /api/cron/* routes. With CRON_SECRET
 * set in Vercel, the scheduler sends "Authorization: Bearer <secret>" and we
 * require an exact match; without it we fall back to the vercel-cron
 * user-agent (weaker, but these routes only trigger already-permitted pushes).
 */
export function isCronCall(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (secret) return req.headers.get("authorization") === `Bearer ${secret}`;
  return (req.headers.get("user-agent") || "").toLowerCase().includes("vercel-cron");
}
