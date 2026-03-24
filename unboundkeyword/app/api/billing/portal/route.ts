import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url), 303);
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.redirect(new URL("/login", req.url), 303);
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!dbUser?.stripeCustomerId) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?billing=no-subscription", req.url),
      303
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    req.headers.get("origin") ??
    "https://unboundkeyword.com";

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: dbUser.stripeCustomerId,
    return_url: `${origin}/dashboard/settings`,
  });

  return NextResponse.redirect(portal.url, 303);
}
