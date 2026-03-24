"use client";

import { useSession } from "next-auth/react";
import { getCheckoutUrl, hasPlanAccess, normalizePlan, PLAN_LABELS } from "@/lib/plans";

interface PlanGateProps {
  /** Minimum plan required, e.g. "solo", "growth", "agency" */
  requiredPlan: string;
  /** Human-readable feature name shown in the lock overlay */
  feature: string;
  children: React.ReactNode;
}

/** Wraps content that requires a higher plan. Shows locked overlay for users below the required plan. */
export default function PlanGate({ requiredPlan, feature, children }: PlanGateProps) {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  const plan = normalizePlan((session?.user as { plan?: string })?.plan);
  const normalizedRequiredPlan = normalizePlan(requiredPlan);
  const hasAccess = hasPlanAccess(plan, normalizedRequiredPlan);

  if (hasAccess) return <>{children}</>;

  return (
    <div className="p-8 max-w-2xl mx-auto mt-8">
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-black text-slate-800 mb-2">{feature}</h2>
        <p className="text-slate-500 text-sm mb-2">
          This feature requires the{" "}
          <span className="font-bold text-[#f15b27] capitalize">{PLAN_LABELS[normalizedRequiredPlan]}</span> plan or above.
        </p>
        <p className="text-slate-400 text-xs mb-6">
          Your current plan: <span className="font-semibold capitalize">{PLAN_LABELS[plan]}</span>
        </p>
        <a
          href={getCheckoutUrl(normalizedRequiredPlan)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white text-sm font-bold px-8 py-3 hover:opacity-90 transition shadow-md"
        >
          See Upgrade Options →
        </a>
        <div className="mt-6 grid grid-cols-3 gap-3 text-left">
          {[
            { plan: "Solo", price: "$25/mo", perks: ["25 keyword hunts", "300 lookups", "5 lists"] },
            { plan: "Growth", price: "$49/mo", perks: ["75 hunts", "Local SEO", "Intent analysis", "GSC integration"] },
            { plan: "Agency", price: "$99/mo", perks: ["200 hunts", "API access", "10 seats", "Bulk export"] },
          ].map((p) => (
            <div key={p.plan} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="font-black text-sm text-slate-800 mb-0.5">{p.plan}</div>
              <div className="text-[#f15b27] font-bold text-xs mb-2">{p.price}</div>
              <ul className="space-y-0.5">
                {p.perks.map((perk) => (
                  <li key={perk} className="text-[10px] text-slate-500 flex items-start gap-1">
                    <span className="text-[#f15b27] font-bold mt-px">✓</span>{perk}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
