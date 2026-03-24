"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PLAN_LABELS, normalizePlan } from "@/lib/plans";

function BillingSuccessInner() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") ?? "free";
  const expectedPlan = normalizePlan(planParam);
  const planLabel = PLAN_LABELS[expectedPlan];

  const [refreshed, setRefreshed] = useState(false);

  useEffect(() => {
    // Poll session.update() until the JWT reflects the new plan (webhook may
    // fire after we land here, so we retry up to ~12 seconds).
    let attempts = 0;
    const MAX_ATTEMPTS = 6;

    async function tryRefresh() {
      const updated = await update();
      const currentPlan = normalizePlan(
        (updated?.user as { plan?: string } | undefined)?.plan
      );
      if (currentPlan === expectedPlan || attempts >= MAX_ATTEMPTS) {
        setRefreshed(true);
        // Redirect to dashboard 2 s after we confirm the plan is active
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        attempts++;
        setTimeout(tryRefresh, 2000);
      }
    }

    tryRefresh();
    // Safety-net redirect after 15 s no matter what
    const fallbackTimer = setTimeout(() => router.push("/dashboard"), 15000);
    return () => clearTimeout(fallbackTimer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="ubk-bg min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-black text-white mb-3">
          Welcome to {planLabel}!
        </h1>
        <p className="text-white/60 text-base mb-2">
          Your subscription is active. All {planLabel} features are now unlocked.
        </p>
        {refreshed ? (
          <p className="text-white/40 text-sm mb-8">
            Your session has been updated. Redirecting to dashboard…
          </p>
        ) : (
          <p className="text-white/40 text-sm mb-8">Activating your plan…</p>
        )}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white font-bold px-8 py-3 hover:opacity-90 transition shadow-md"
        >
          Go to Dashboard →
        </Link>
        <div className="mt-6">
          <Link
            href="/api/billing/portal"
            className="text-white/40 text-sm hover:text-white/60 transition underline"
          >
            Manage billing / cancel
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense>
      <BillingSuccessInner />
    </Suspense>
  );
}
