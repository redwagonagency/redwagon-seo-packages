import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  stripeClient = new Stripe(key, { apiVersion: "2026-02-25.clover" });
  return stripeClient;
}

/** Map plan slug → Stripe price ID from env */
export const STRIPE_PRICE_IDS: Record<string, string | undefined> = {
  solo:   process.env.STRIPE_PRICE_ID_SOLO,
  growth: process.env.STRIPE_PRICE_ID_GROWTH,
  agency: process.env.STRIPE_PRICE_ID_AGENCY,
};

export function getPriceId(plan: string): string {
  const priceId = STRIPE_PRICE_IDS[plan];
  if (!priceId) throw new Error(`No Stripe price ID configured for plan: ${plan}`);
  return priceId;
}
