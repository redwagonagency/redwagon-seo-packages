import { Suspense } from "react";
import CompetitorIntelligenceClient from "@/components/dashboard/CompetitorIntelligenceClient";

export const metadata = { title: "Competitor Intelligence - UnBoundKeyword" };

export default function CompetitorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading competitor intelligence...</div>}>
      <CompetitorIntelligenceClient />
    </Suspense>
  );
}
