import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { sendPushToUser } from "@/lib/push";

/**
 * Stripe webhook: the single source of truth for who is Pro.
 * Configure the endpoint in the Stripe dashboard pointing at
 * {SITE_URL}/api/billing/webhook with events:
 *   checkout.session.completed, customer.subscription.updated,
 *   customer.subscription.deleted
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    // Signature is computed over the raw body — read text, never parsed JSON.
    const raw = await req.text();
    event = getStripe().webhooks.constructEvent(raw, signature, secret);
  } catch (e) {
    console.error("stripe webhook signature verification failed:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id ?? session.metadata?.userId;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { plan: "pro", proUntil: null, ...(customerId ? { stripeCustomerId: customerId } : {}) },
          });
          await sendPushToUser(userId, {
            title: "👑 Welcome to Pro!",
            body: "Your subscription is active — themes, unlimited accounts, the AI coach and more are unlocked.",
            url: "/",
          }).catch(() => null);
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
        if (user) {
          const active = sub.status === "active" || sub.status === "trialing" || sub.status === "past_due";
          const periodEnd = sub.items.data[0]?.current_period_end;
          await prisma.user.update({
            where: { id: user.id },
            data: active
              ? { plan: "pro", proUntil: sub.cancel_at_period_end && periodEnd ? new Date(periodEnd * 1000) : null }
              : { plan: "free", proUntil: null },
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        await prisma.user
          .updateMany({ where: { stripeCustomerId: customerId }, data: { plan: "free", proUntil: null } })
          .catch(() => null);
        break;
      }
    }
  } catch (e) {
    // Return 500 so Stripe retries the delivery.
    console.error(`stripe webhook handling failed for ${event.type}:`, e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
