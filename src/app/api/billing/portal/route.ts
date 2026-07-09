import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";

/** Open the Stripe billing portal (change card, cancel, invoices). */
export async function POST() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Billing isn't set up" }, { status: 503 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true } });
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No subscription on this account — it was activated manually" }, { status: 404 });
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${SITE_URL}/settings`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("stripe portal failed:", e);
    return NextResponse.json({ error: "Couldn't open the billing portal — try again shortly" }, { status: 502 });
  }
}
