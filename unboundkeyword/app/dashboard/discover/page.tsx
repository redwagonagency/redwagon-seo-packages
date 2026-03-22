import { Suspense } from "react";
import DiscoveryClient from "@/components/dashboard/DiscoveryClient";

export const metadata = { title: "Keyword Discovery — UnBoundKeyword" };

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading keyword discovery…</div>}>
      <DiscoveryClient />
    </Suspense>
  );
}
