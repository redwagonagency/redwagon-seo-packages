"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PLAN_LABELS, normalizePlan } from "@/lib/plans";

export default function BillingSuccessPage() {
  const { update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") ?? "free";
  const plan = normalizePlan(planParam);
  const planLabel = PLAN_LABELS[plan];

  const [refreshed, setRefreshed] = useState(false);

  useEffect(() => {
    // Force-refresh the JWT so the new plan is reflected immediately
    update().then(() => setRefreshed(true));
    // Auto-redirect to dashboard after 4 seconds
    const timer = setTimeout(() => router.push("/dashboard"), 4000);
    return () => clearTimeout(timer);
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
