import Link from "next/link";
import DashboardSearch from "@/components/dashboard/DashboardSearch";
import IntegrationConnectPanel from "@/components/dashboard/IntegrationConnectPanel";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSelectedSiteForUser } from "@/lib/site-context";
import { buildJoeInsight, type JoeInsightResult } from "@/lib/joe-insights";

export default async function DashboardPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return null;

  const selectedSite = await getSelectedSiteForUser(userId);

  const [listCount, keywordCount, googleLinked, topKeywordRow, avgCpcRow, industryStats] = await Promise.all([
    prisma.keywordList.count({ where: { userId, ...(selectedSite ? { siteId: selectedSite.id } : { siteId: null }) } }),
    prisma.keywordInList.count({
      where: {
        list: { userId, ...(selectedSite ? { siteId: selectedSite.id } : { siteId: null }) },
      },
    }),
    prisma.account.findFirst({ where: { userId, provider: "google" } }),
    prisma.keywordInList.findFirst({
      where: {
        list: { userId, ...(selectedSite ? { siteId: selectedSite.id } : { siteId: null }) },
      },
      orderBy: [{ volume: "desc" }],
      select: { keyword: true, volume: true },
    }),
    prisma.keywordInList.aggregate({
      where: {
        list: { userId, ...(selectedSite ? { siteId: selectedSite.id } : { siteId: null }) },
      },
      _avg: { cpc: true },
    }),
    (prisma as unknown as {
      industryStat: {
        findMany: (args: unknown) => Promise<Array<{ metricKey: string; metricValue: number; unit: string | null; note: string | null }>>;
      };
    }).industryStat.findMany({
      where: { industry: "general" },
      select: { metricKey: true, metricValue: true, unit: true, note: true },
      take: 20,
    }),
  ]);

  const joeInsight: JoeInsightResult = buildJoeInsight({
    domain: selectedSite?.domain || "your site",
    listCount,
    keywordCount,
    topKeyword: topKeywordRow?.keyword || null,
    topKeywordVolume: topKeywordRow?.volume || 0,
    avgKeywordCpc: avgCpcRow._avg.cpc || 0,
    industryStats,
  });

  return (
    <div className="p-8 max-w-7xl">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-[#f15b27] font-black mb-1">Dashboard</div>
            <h1 className="text-3xl font-black text-slate-900">{selectedSite ? selectedSite.domain : "Add your first domain"}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Showing SEO progress for your selected site. All research and lists are scoped to this domain.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {!googleLinked ? (
              <a
                href="/api/auth/signin/google"
                className="px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition font-semibold"
              >
                Sign in with Google →
              </a>
            ) : (
              <span className="px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                Google linked
              </span>
            )}
            {selectedSite ? (
              <>
                {selectedSite.ga4Connected ? (
                  <span className="px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">GA4 connected</span>
                ) : (
                  <a href="#connect" className="px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition font-semibold">
                    GA4 — connect ↓
                  </a>
                )}
                {selectedSite.gscConnected ? (
                  <span className="px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">GSC connected</span>
                ) : (
                  <a href="#connect" className="px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition font-semibold">
                    GSC — connect ↓
                  </a>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>

      <DashboardSearch />

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-2">Keyword Lists</div>
          <div className="text-4xl font-black text-slate-900">{listCount}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-2">Tracked Keywords</div>
          <div className="text-4xl font-black text-slate-900">{keywordCount}</div>
        </div>
      </div>

      {/* Joe Insight — positioned between stats and nav cards */}
      <div className="mb-6 rounded-2xl border border-[#f15b27]/20 bg-[#fff8f5] p-5">
        <div className="flex items-start gap-4">
          <img
            src="/joe-headshot.png"
            alt="Joe from Redwagon"
            className="h-12 w-12 rounded-full object-cover ring-2 ring-[#f15b27]/30 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-[0.16em] text-[#f15b27] font-black mb-0.5">Industry Insight</div>
            <h2 className="text-base font-black text-slate-900 leading-snug">{joeInsight.headline}</h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">{joeInsight.body}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-lg font-black text-slate-900">{joeInsight.metric1.value}</div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">{joeInsight.metric1.label}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-slate-900">{joeInsight.metric2.value}</div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">{joeInsight.metric2.label}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-slate-900">{joeInsight.metric3.value}</div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">{joeInsight.metric3.label}</div>
                </div>
              </div>
              <Link
                href={
                  joeInsight.action === "Run AI Decision Report"
                    ? "/dashboard/decision-engine"
                    : joeInsight.action === "Create first keyword list"
                    ? "/dashboard/lists"
                    : joeInsight.action === "Add keywords to your list"
                    ? "/dashboard/lists"
                    : "/dashboard/settings/projects"
                }
                className="ml-auto text-xs font-bold text-[#f15b27] border border-[#f15b27]/40 rounded-lg px-3 py-1.5 hover:bg-[#f15b27] hover:text-white transition"
              >
                {joeInsight.action} →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/dashboard/traffic" className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#f15b27] transition">
            <div className="text-xs uppercase tracking-[0.16em] text-[#f15b27] font-black mb-2">Traffic</div>
            <h3 className="text-lg font-black text-slate-900">Website Traffic Checker</h3>
            <p className="text-sm text-slate-500 mt-1">Estimate traffic, top pages, and keyword opportunities.</p>
          </Link>
          <Link href="/dashboard/competitor" className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#f15b27] transition">
            <div className="text-xs uppercase tracking-[0.16em] text-[#f15b27] font-black mb-2">Competitive</div>
            <h3 className="text-lg font-black text-slate-900">Competing Domains</h3>
            <p className="text-sm text-slate-500 mt-1">Compare competitor traffic and ranking keywords.</p>
          </Link>
          <Link href="/dashboard/keyword-overview" className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#f15b27] transition">
            <div className="text-xs uppercase tracking-[0.16em] text-[#f15b27] font-black mb-2">Keyword Research</div>
            <h3 className="text-lg font-black text-slate-900">Keyword Overview</h3>
            <p className="text-sm text-slate-500 mt-1">Volume, CPC, SEO and paid difficulty, and trends.</p>
          </Link>
        </div>

        <div id="connect">
          <IntegrationConnectPanel
            ga4Connected={selectedSite?.ga4Connected ?? false}
            gscConnected={selectedSite?.gscConnected ?? false}
          />
        </div>
      </div>



    </div>
  );
}
