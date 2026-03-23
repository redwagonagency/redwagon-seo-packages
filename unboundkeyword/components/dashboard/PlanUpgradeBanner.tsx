"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

const PLAN_LIMITS: Record<string, { label: string; hunts: number; lookups: number; lists: number; savedKw: number }> = {
  free:   { label: "Free",   hunts: 10,  lookups: 120,   lists: 2,   savedKw: 200 },
  solo:   { label: "Solo",   hunts: 25,  lookups: 300,   lists: 5,   savedKw: 500 },
  growth: { label: "Growth", hunts: 75,  lookups: 1000,  lists: 20,  savedKw: 2000 },
  agency: { label: "Agency", hunts: 200, lookups: 3000,  lists: 999, savedKw: 10000 },
};

const LOCKED_FEATURES_BY_PLAN: Record<string, string[]> = {
  free: ["Local keyword research", "Intent analysis", "GSC integration", "Google Sheets export", "AI Content Map"],
  solo: ["Intent analysis", "GSC integration", "Google Sheets export", "API access"],
  growth: ["API access", "Bulk export"],
  agency: [],
};

export default function PlanUpgradeBanner() {
  const { data: session } = useSession();
  const plan = ((session?.user as { plan?: string })?.plan ?? "free").toLowerCase();

  if (plan === "agency") return null; // fully unlocked

  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const lockedFeatures = LOCKED_FEATURES_BY_PLAN[plan] ?? LOCKED_FEATURES_BY_PLAN.free;

  const nextPlan = plan === "free" ? "Solo ($25/mo)" : plan === "solo" ? "Growth ($49/mo)" : plan === "growth" ? "Agency ($99/mo)" : null;
  const upgradeHref = plan === "free" ? "/pricing" : "/pricing";

  return (
    <div className="mx-0 mb-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 flex flex-wrap items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700">
            {limits.label} Plan
          </span>
          <span className="text-xs font-semibold text-slate-700">
            {limits.hunts} keyword hunts · {limits.lookups} lookups · {limits.lists} lists · {limits.savedKw.toLocaleString()} saved keywords / month
          </span>
        </div>
        {lockedFeatures.length > 0 && (
          <p className="text-[11px] text-slate-500 leading-tight">
            <span className="font-semibold text-rose-600">Locked on {limits.label}:</span>{" "}
            {lockedFeatures.join(" · ")}
          </p>
        )}
      </div>
      {nextPlan && (
        <Link
          href={upgradeHref}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white text-xs font-bold px-4 py-2 hover:opacity-90 transition shadow-sm"
        >
          ↑ Upgrade to {nextPlan}
        </Link>
      )}
    </div>
  );
}

/** Drop this over any feature that's locked on the current plan */
export function FeatureLockOverlay({ feature, requiredPlan = "Growth" }: { feature: string; requiredPlan?: string }) {
  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Blurred content placeholder */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="text-3xl">🔒</div>
        <div>
          <p className="font-bold text-slate-800 text-sm mb-1">{feature} — Upgrade Required</p>
          <p className="text-xs text-slate-500 mb-4">
            This feature is available on the <span className="font-semibold text-[#f15b27]">{requiredPlan}</span> plan and above.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white text-xs font-bold px-5 py-2.5 hover:opacity-90 transition shadow"
          >
            View Plans & Upgrade
          </Link>
        </div>
      </div>
      {/* Blurred preview */}
      <div className="pointer-events-none select-none blur-sm opacity-60 p-6">
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
        <div className="h-3 bg-slate-100 rounded w-full mb-2" />
        <div className="h-3 bg-slate-100 rounded w-3/4 mb-2" />
        <div className="h-3 bg-slate-100 rounded w-5/6" />
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-lg" />)}
        </div>
      </div>
    </div>
  );
}
