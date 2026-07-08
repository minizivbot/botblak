import { prisma } from "./prisma";
import { isUserAdmin } from "./admin";

/** Free-tier limits. Existing data over a limit is grandfathered (never deleted). */
export const FREE_ACCOUNT_LIMIT = 2;

export const PRICING = {
  monthlyFirst: 5, // intro price for the first month
  monthly: 15,
  yearly: 120, // paid up front (= $10/mo)
  /** First-year cost on monthly billing: $5 intro + 11 × $15. */
  get monthlyFirstYear() {
    return this.monthlyFirst + 11 * this.monthly;
  },
  /** Percent saved by paying yearly vs. month-by-month for a year. */
  get yearlySavePct() {
    return Math.round((1 - this.yearly / this.monthlyFirstYear) * 100);
  },
} as const;

type PlanUser = { plan: string; proUntil: Date | null };

/** True while a "pro" plan hasn't expired. (Admin override is in isProUser.) */
export function planIsPro(user: PlanUser | null): boolean {
  if (!user || user.plan !== "pro") return false;
  return user.proUntil == null || user.proUntil.getTime() > Date.now();
}

/**
 * True if the user has Pro access: an active "pro" plan, or admin (admins
 * always get every feature so the owner is never locked out of their own site).
 */
export async function isProUser(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, proUntil: true },
  });
  if (planIsPro(user)) return true;
  return isUserAdmin(userId);
}
