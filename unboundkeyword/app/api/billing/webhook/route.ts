import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { normalizePlan } from "@/lib/plans";

function customerIdFrom(
  c: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null {
  if (!c) return null;
  return typeof c === "string" ? c : c.id;
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing Stripe webhook configuration." },
      { status: 400 }
    );
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook signature failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    // ── Payment completed → activate plan ──────────────────────────────────
    if (event.type === "checkout.session.completed") {
      const cs = event.data.object as Stripe.Checkout.Session;
      const userId = cs.metadata?.userId;
      const plan = normalizePlan(cs.metadata?.plan);
      const subscriptionId =
        typeof cs.subscription === "string" ? cs.subscription : cs.subscription?.id;
      const customerId = customerIdFrom(cs.customer);

      if (userId && plan !== "free") {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            stripeCustomerId: customerId ?? undefined,
            stripeSubscriptionId: subscriptionId ?? undefined,
          },
        });
      }
    }

    // ── Subscription updated (plan change, renewal) ─────────────────────────
    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.created"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      const plan = normalizePlan(sub.metadata?.plan);
      const customerId = customerIdFrom(sub.customer);

      if (userId && plan !== "free") {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            stripeCustomerId: customerId ?? undefined,
            stripeSubscriptionId: sub.id,
          },
        });
      }
    }

    // ── Subscription cancelled → downgrade to free ─────────────────────────
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          plan: "free",
          stripeSubscriptionId: null,
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe-webhook]", err);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
