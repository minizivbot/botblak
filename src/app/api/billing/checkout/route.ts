import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { stripeConfigured, getStripe, priceIdFor } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";

const schema = z.object({ plan: z.enum(["monthly", "yearly"]) });

/** Start a Stripe Checkout session for the chosen Pro plan. */
export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  if (!stripeConfigured()) {
    // Pricing page falls back to the upgrade-by-support-message flow.
    return NextResponse.json({ error: "checkout-not-configured" }, { status: 503 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "plan must be monthly or yearly" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    const stripe = getStripe();
    const intro = process.env.STRIPE_COUPON_INTRO; // optional "$10 off first invoice" coupon for the $5 first month
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceIdFor(parsed.data.plan), quantity: 1 }],
      client_reference_id: userId,
      ...(user.stripeCustomerId ? { customer: user.stripeCustomerId } : user.email ? { customer_email: user.email } : {}),
      ...(parsed.data.plan === "monthly" && intro ? { discounts: [{ coupon: intro }] } : {}),
      allow_promotion_codes: parsed.data.plan === "yearly" || !intro ? true : undefined,
      success_url: `${SITE_URL}/pricing?upgraded=1`,
      cancel_url: `${SITE_URL}/pricing`,
      metadata: { userId, plan: parsed.data.plan },
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("stripe checkout failed:", e);
    return NextResponse.json({ error: "Couldn't start checkout — try again shortly" }, { status: 502 });
  }
}
