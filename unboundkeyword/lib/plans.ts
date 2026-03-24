export const PLAN_ORDER = ["free", "solo", "growth", "agency"] as const;

export type UserPlan = (typeof PLAN_ORDER)[number];

export const PLAN_LABELS: Record<UserPlan, string> = {
  free: "Free",
  solo: "Solo",
  growth: "Growth",
  agency: "Agency",
};

export function normalizePlan(plan: string | null | undefined): UserPlan {
  const value = (plan ?? "free").toLowerCase();
  return (PLAN_ORDER as readonly string[]).includes(value) ? (value as UserPlan) : "free";
}

export function getPlanIndex(plan: string | null | undefined): number {
  return PLAN_ORDER.indexOf(normalizePlan(plan));
}

export function hasPlanAccess(currentPlan: string | null | undefined, requiredPlan: string): boolean {
  return getPlanIndex(currentPlan) >= getPlanIndex(requiredPlan);
}

export function getNextPlan(plan: string | null | undefined): UserPlan | null {
  const index = getPlanIndex(plan);
  return PLAN_ORDER[index + 1] ?? null;
}

export function getUpgradeHref(plan: string | null | undefined): string {
  const normalizedPlan = normalizePlan(plan);
  return `/pricing?plan=${normalizedPlan}`;
}

/**
 * Returns the direct Stripe checkout URL for the given plan.
 * Use this inside authenticated contexts (dashboard, plan gates).
 */
export function getCheckoutUrl(plan: string | null | undefined): string {
  const normalizedPlan = normalizePlan(plan);
  return `/api/billing/checkout?plan=${normalizedPlan}`;
}