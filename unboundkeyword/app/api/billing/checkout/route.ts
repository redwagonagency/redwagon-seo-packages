import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, getPriceId } from "@/lib/stripe";
import { normalizePlan } from "@/lib/plans";

function appOrigin(req: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    req.headers.get("origin") ??
    "https://unboundkeyword.com"
  );
}

/**
 * GET /api/billing/checkout?plan=solo|growth|agency
 *
 * - Anonymous users → redirect to /login then come back
 * - Logged-in users  → create Stripe Checkout session & redirect
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const planParam = url.searchParams.get("plan") ?? "";
  const plan = normalizePlan(planParam);

  if (plan === "free") {
    // Free plan has no payment — send to register/dashboard
    return NextResponse.redirect(new URL("/register", req.url), 303);
  }

  const session = await auth();
  if (!session?.user) {
    // Preserve the intended plan so we return here after login
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", `/api/billing/checkout?plan=${plan}`);
    return NextResponse.redirect(loginUrl, 303);
  }

  const userId = (session.user as { id?: string }).id;
  const email = session.user.email!;

  if (!userId) {
    return NextResponse.redirect(new URL("/login", req.url), 303);
  }

  let priceId: string;
  try {
    priceId = getPriceId(plan);
  } catch {
    return NextResponse.redirect(
      new URL(`/pricing?billing=missing-price-id&plan=${plan}`, req.url),
      303
    );
  }

  const stripe = getStripe();
  const origin = appOrigin(req);

  // Ensure user has a Stripe customer ID
  let stripeCustomerId: string | null = null;
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });
  stripeCustomerId = dbUser?.stripeCustomerId ?? null;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email,
      name: session.user.name ?? undefined,
      metadata: { userId },
    });
    stripeCustomerId = customer.id;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId, plan },
    // Allow applying promo codes at checkout
    allow_promotion_codes: true,
    success_url: `${origin}/dashboard/billing-success?plan=${plan}`,
    cancel_url: `${origin}/pricing?billing=cancelled`,
  });

  if (!checkoutSession.url) {
    return NextResponse.redirect(
      new URL("/pricing?billing=checkout-error", req.url),
      303
    );
  }

  return NextResponse.redirect(checkoutSession.url, 303);
}
