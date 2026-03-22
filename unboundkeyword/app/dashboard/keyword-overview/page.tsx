import OverviewWithVolume from "@/components/dashboard/OverviewWithVolume";

export default function KeywordOverviewPage() {
  return (
    <div className="p-8 max-w-7xl">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 mb-6">
        <div className="text-xs uppercase tracking-[0.16em] text-[#f15b27] font-black mb-1">Keyword Overview</div>
        <h1 className="text-3xl font-black text-slate-900">Historical Search Volume</h1>
        <p className="text-sm text-slate-600 mt-2">
          Pull desktop and mobile search trends, plus related opportunities, from your live keyword data.
        </p>
      </div>
      <OverviewWithVolume />
    </div>
  );
}
