import { Suspense } from "react";
import DecisionEngineClient from "@/components/dashboard/DecisionEngineClient";

export const metadata = { title: "AI Decision Engine - UnBoundKeyword" };

export default function DecisionEnginePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading decision engine...</div>}>
      <DecisionEngineClient />
    </Suspense>
  );
}
