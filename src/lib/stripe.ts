import Stripe from "stripe";

/**
 * Stripe goes live once the owner sets STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 * and the two price IDs in the environment. Until then, checkout returns 503
 * and the pricing page falls back to upgrade-by-support-message.
 */

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_MONTHLY && process.env.STRIPE_PRICE_YEARLY);
}

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return client;
}

export function priceIdFor(plan: "monthly" | "yearly"): string {
  return plan === "yearly" ? process.env.STRIPE_PRICE_YEARLY! : process.env.STRIPE_PRICE_MONTHLY!;
}
