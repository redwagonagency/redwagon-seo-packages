import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isJoeSuperAdmin } from "@/lib/superadmin";
import { estimateEndpointPrice, extractDfsCostUsdFromResponse } from "@/lib/api-pricing";
import SuperadminIndustryStatsManager from "@/components/dashboard/SuperadminIndustryStatsManager";
import AiMonitorPanel from "@/components/dashboard/AiMonitorPanel";

export const dynamic = "force-dynamic";

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function parseLoggedApiCost(responseJson: string | null): number | null {
  if (!responseJson) return null;
  try {
    const parsed = JSON.parse(responseJson) as unknown;
    return extractDfsCostUsdFromResponse(parsed);
  } catch {
    return null;
  }
}

export default async function SuperadminPage() {
  const session = await auth();
  if (!isJoeSuperAdmin(session?.user?.email)) {
    return (
      <div className="p-10">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  // Parallel data fetches
  const [
    users,
    userCount,
    projectCount,
    keywordCount,
    statCount,
    stats,
    apiLogCount,
    recentApiLogs,
    topEndpoints,
    projectsWithDomains,
    recentUsers,
    kwIntelCount,
    recentKwIntel,
    recentSearchHistory,
    userSearchCount,
    topSearchedKws,
    apiByUserEndpoint,
    searchByUser,
    competitorCacheCount,
    discoveryKeywordCount,
    uncategorizedKeywordsCount,
    apiLogsWithRequest,
    apiLogsWithResponse,
    apiLogsFailed,
    apiByUseCase,
    recentApiPayloads,
    keywordListsBySite,
    discoveryBySite,
  ] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.user.count(),
    prisma.siteProject.count(),
    prisma.keywordInList.count(),
    prisma.industryStat.count(),
    prisma.industryStat.findMany({
      orderBy: [{ industry: "asc" }, { metricKey: "asc" }],
      take: 50,
    }),
    prisma.apiQueryLog.count(),
    prisma.apiQueryLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    // Group by endpoint to find most-used
    prisma.apiQueryLog.groupBy({
      by: ["provider", "endpoint"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    // Projects with user info for per-user breakdown
    prisma.siteProject.findMany({
      select: { id: true, domain: true, userId: true, createdAt: true, competitors: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    // Keyword intelligence stored results
    prisma.keywordIntelligence.count(),
    prisma.keywordIntelligence.findMany({
      orderBy: { lastAnalyzed: "desc" },
      take: 50,
      include: { user: { select: { email: true } } },
    }),
    // User search history
    prisma.userSearch.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }).catch(() => []),
    prisma.userSearch.count().catch(() => 0),
    // Most searched keywords
    prisma.userSearch.groupBy({
      by: ["query"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 20,
    }).catch(() => []),
    prisma.apiQueryLog.groupBy({
      by: ["userId", "provider", "endpoint"],
      where: { userId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 1000,
    }).catch(() => []),
    prisma.userSearch.groupBy({
      by: ["userId"],
      _count: { id: true },
    }).catch(() => []),
    prisma.competitorAnalysisCache.count().catch(() => 0),
    prisma.discoveryKeyword.count().catch(() => 0),
    prisma.keywordInList.count({
      where: { list: { name: "Uncategorized" } },
    }).catch(() => 0),
    prisma.apiQueryLog.count({ where: { requestJson: { not: null } } }).catch(() => 0),
    prisma.apiQueryLog.count({ where: { responseJson: { not: null } } }).catch(() => 0),
    prisma.apiQueryLog.count({ where: { success: false } }).catch(() => 0),
    prisma.apiQueryLog.groupBy({
      by: ["provider", "useCase", "success"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 200,
    }).catch(() => []),
    prisma.apiQueryLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        user: { select: { email: true } },
        site: { select: { domain: true } },
      },
    }).catch(() => []),
    prisma.keywordList.findMany({
      select: {
        siteId: true,
        _count: { select: { keywords: true } },
      },
      where: { siteId: { not: null } },
    }).catch(() => []),
    prisma.discoveryKeyword.groupBy({
      by: ["siteId"],
      _count: { id: true },
      where: { siteId: { not: null } },
      orderBy: { _count: { id: "desc" } },
      take: 500,
    }).catch(() => []),
  ]);

  // User signup buckets by month (last 6 months)
  const now = new Date();
  const monthBuckets: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const count = users.filter((u) => u.createdAt >= d && u.createdAt < end).length;
    monthBuckets.push({ label, count });
  }
  const maxMonthCount = Math.max(...monthBuckets.map((b) => b.count), 1);

  // Per-user project counts
  const projectsByUser = new Map<string, number>();
  for (const p of projectsWithDomains) {
    projectsByUser.set(p.userId, (projectsByUser.get(p.userId) ?? 0) + 1);
  }

  // Users email lookup map
  const userEmailMap = new Map(users.map((u) => [u.id, u.email ?? "—"]));

  // Users joined this month
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const newUsersThisMonth = users.filter((u) => u.createdAt >= thisMonthStart).length;

  const endpointKeys = (topEndpoints as { provider: string; endpoint: string }[]).map((ep) => ep.endpoint);
  const endpointCostLogs = endpointKeys.length > 0
    ? await prisma.apiQueryLog.findMany({
      where: { endpoint: { in: endpointKeys } },
      select: { endpoint: true, responseJson: true, provider: true },
    })
    : [];

  const endpointActualCost = new Map<string, { totalCost: number; pricedCalls: number }>();
  for (const row of endpointCostLogs) {
    const cost = parseLoggedApiCost(row.responseJson);
    if (cost == null) continue;
    const current = endpointActualCost.get(row.endpoint) ?? { totalCost: 0, pricedCalls: 0 };
    current.totalCost += cost;
    current.pricedCalls += 1;
    endpointActualCost.set(row.endpoint, current);
  }

  const endpointCostRows = (topEndpoints as Array<{ provider: string; endpoint: string; _count: { id: number } }>).map((ep) => {
    const pricing = estimateEndpointPrice(ep.endpoint);
    const actual = endpointActualCost.get(ep.endpoint);
    const pricedCalls = actual?.pricedCalls ?? 0;
    const unknownCalls = Math.max(ep._count.id - pricedCalls, 0);
    const estimatedFallback = ep.provider === "dataforseo" ? unknownCalls * pricing.estimatedUsdPerCall : 0;
    const actualCost = actual?.totalCost ?? 0;
    const computed = actualCost + estimatedFallback;
    return {
      provider: ep.provider,
      endpoint: ep.endpoint,
      calls: ep._count.id,
      costPerCall: pricing.estimatedUsdPerCall,
      pricingRule: pricing.matchedRule,
      pricedCalls,
      estimated: computed,
      actualCost,
      fallbackCost: estimatedFallback,
    };
  });
  const totalEstimatedCost = endpointCostRows.reduce((s, e) => s + e.estimated, 0);
  const requestCoverage = apiLogCount > 0 ? (apiLogsWithRequest / apiLogCount) * 100 : 0;
  const responseCoverage = apiLogCount > 0 ? (apiLogsWithResponse / apiLogCount) * 100 : 0;

  const useCaseMap = new Map<string, { provider: string; useCase: string; total: number; success: number; failed: number }>();
  for (const row of (apiByUseCase as { provider: string; useCase: string; success: boolean; _count: { id: number } }[])) {
    const key = `${row.provider}::${row.useCase}`;
    const current = useCaseMap.get(key) ?? { provider: row.provider, useCase: row.useCase, total: 0, success: 0, failed: 0 };
    current.total += row._count.id;
    if (row.success) current.success += row._count.id;
    else current.failed += row._count.id;
    useCaseMap.set(key, current);
  }
  const useCaseRows = [...useCaseMap.values()].sort((a, b) => b.total - a.total).slice(0, 40);

  const siteKeywordTotals = new Map<string, number>();
  for (const row of (keywordListsBySite as { siteId: string | null; _count: { keywords: number } }[])) {
    if (!row.siteId) continue;
    siteKeywordTotals.set(row.siteId, (siteKeywordTotals.get(row.siteId) ?? 0) + row._count.keywords);
  }

  const siteDiscoveryTotals = new Map<string, number>();
  for (const row of (discoveryBySite as { siteId: string | null; _count: { id: number } }[])) {
    if (!row.siteId) continue;
    siteDiscoveryTotals.set(row.siteId, row._count.id);
  }

  const domainStorageRows = projectsWithDomains
    .map((project) => ({
      domain: project.domain,
      owner: userEmailMap.get(project.userId) ?? "—",
      keywords: siteKeywordTotals.get(project.id) ?? 0,
      discovery: siteDiscoveryTotals.get(project.id) ?? 0,
    }))
    .sort((a, b) => (b.keywords + b.discovery) - (a.keywords + a.discovery))
    .slice(0, 50);

  const searchByUserMap = new Map(
    (searchByUser as { userId: string; _count: { id: number } }[]).map((row) => [row.userId, row._count.id])
  );

  const userCostLogs = await prisma.apiQueryLog.findMany({
    where: { userId: { not: null } },
    select: { userId: true, endpoint: true, responseJson: true, provider: true },
  }).catch(() => []);

  const userActualCostMap = new Map<string, number>();
  for (const row of userCostLogs) {
    if (!row.userId) continue;
    const cost = parseLoggedApiCost(row.responseJson);
    if (cost == null) continue;
    userActualCostMap.set(row.userId, (userActualCostMap.get(row.userId) ?? 0) + cost);
  }

  const userCostMap = new Map<string, { calls: number; estimatedCost: number; topEndpoints: string[] }>();
  for (const row of (apiByUserEndpoint as { userId: string | null; provider: string; endpoint: string; _count: { id: number } }[])) {
    if (!row.userId) continue;
    const pricing = estimateEndpointPrice(row.endpoint);
    const current = userCostMap.get(row.userId) ?? { calls: 0, estimatedCost: 0, topEndpoints: [] };
    current.calls += row._count.id;
    if (row.provider === "dataforseo") {
      current.estimatedCost += row._count.id * pricing.estimatedUsdPerCall;
    }
    if (current.topEndpoints.length < 3 && !current.topEndpoints.includes(row.endpoint)) {
      current.topEndpoints.push(row.endpoint);
    }
    userCostMap.set(row.userId, current);
  }

  const perUserUsageRows = users
    .map((user) => {
      const usage = userCostMap.get(user.id) ?? { calls: 0, estimatedCost: 0, topEndpoints: [] };
      const actualCost = userActualCostMap.get(user.id) ?? 0;
      return {
        id: user.id,
        email: user.email ?? "—",
        calls: usage.calls,
        estimatedCost: actualCost > 0 ? actualCost : usage.estimatedCost,
        searches: searchByUserMap.get(user.id) ?? 0,
        topEndpoints: usage.topEndpoints,
      };
    })
    .filter((row) => row.calls > 0 || row.searches > 0)
    .sort((a, b) => b.calls - a.calls || b.searches - a.searches)
    .slice(0, 50);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_15%,rgba(241,91,39,0.12),transparent_35%),radial-gradient(circle_at_85%_8%,rgba(20,184,166,0.13),transparent_30%),linear-gradient(180deg,#fafaf9_0%,#f8fafc_52%,#fff7ed_100%)] p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-gradient-to-br from-slate-950 via-slate-900 to-[#1b0e07] p-7 shadow-2xl shadow-[#f15b27]/20">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#f15b27]/20 blur-3xl" />
        <div className="pointer-events-none absolute left-8 bottom-0 h-24 w-24 rounded-full bg-teal-400/20 blur-2xl" />
        <p className="text-xs uppercase tracking-[0.2em] text-[#f15b27] font-black">Superadmin</p>
        <h1 className="mt-2 text-4xl font-black text-white">Operator War Room</h1>
        <p className="mt-1 text-sm text-slate-300">Live cost telemetry, payload intelligence, and full-funnel storage observability.</p>
        <div className="mt-5 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-[#f15b27]/40 bg-[#f15b27]/10 px-3 py-1 text-[#ffb496]">DataForSEO Cost = parsed from response cost fields</span>
          <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-teal-200">Fallback estimate only when response cost is missing</span>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        {[
          { label: "Total Users", value: fmt(userCount), sub: `+${newUsersThisMonth} this month`, color: "text-emerald-500" },
          { label: "Projects", value: fmt(projectCount) },
          { label: "Tracked Keywords", value: fmt(keywordCount) },
          { label: "KW Intelligence", value: fmt(kwIntelCount), sub: "stored records" },
          { label: "API Req Coverage", value: `${requestCoverage.toFixed(1)}%`, sub: `${fmt(apiLogsWithRequest)} / ${fmt(apiLogCount)}` },
          { label: "API Resp Coverage", value: `${responseCoverage.toFixed(1)}%`, sub: `${fmt(apiLogsWithResponse)} / ${fmt(apiLogCount)}`, color: responseCoverage >= 99.9 ? "text-emerald-500" : "text-amber-500" },
          { label: "API Failures", value: fmt(apiLogsFailed), sub: `$${totalEstimatedCost.toFixed(2)} modeled`, color: apiLogsFailed > 0 ? "text-rose-500" : "text-emerald-500" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200/80 bg-white/85 backdrop-blur p-4 shadow-sm shadow-slate-200/60">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{card.label}</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{card.value}</p>
            {card.sub && <p className={`text-[11px] mt-1 ${card.color ?? "text-slate-400"}`}>{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* User Growth Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="text-xs uppercase tracking-[0.16em] font-black text-slate-400 mb-4">User Signups — Last 6 Months</div>
        <div className="flex items-end gap-2 h-24">
          {monthBuckets.map((b) => (
            <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-slate-400 tabular-nums">{b.count}</span>
              <div
                className="w-full bg-[#f15b27] rounded-t-md transition-all"
                style={{ height: `${Math.max((b.count / maxMonthCount) * 72, b.count > 0 ? 4 : 2)}px` }}
              />
              <span className="text-[10px] text-slate-400">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Users table */}
        <section className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">All Users ({userCount})</h2>
          </div>
          <div className="overflow-y-auto max-h-[420px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">User</th>
                  <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">Projects</th>
                  <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-slate-800 text-xs">{user.name ?? "—"}</p>
                      <p className="text-[10px] text-slate-400">{user.email ?? "—"}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-slate-600 tabular-nums">{projectsByUser.get(user.id) ?? 0}</td>
                    <td className="px-4 py-2.5 text-right text-[10px] text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Projects table */}
        <section className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">All Projects ({projectCount})</h2>
          </div>
          <div className="overflow-y-auto max-h-[420px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">Domain</th>
                  <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">Competitors</th>
                  <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">Created</th>
                </tr>
              </thead>
              <tbody>
                {projectsWithDomains.map((p) => {
                  let compList: string[] = [];
                  try { compList = JSON.parse(p.competitors ?? "[]") as string[]; } catch { /* empty */ }
                  return (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-semibold text-slate-800 text-xs">{p.domain}</td>
                      <td className="px-4 py-2.5 text-right text-xs text-slate-500">
                        {compList.length > 0 ? compList.slice(0, 3).join(", ") : <span className="text-slate-300">none</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ── DATA OUTPUT ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs uppercase tracking-[0.18em] font-black text-[#f15b27] mb-3">Stored Data Output</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Discovery Keywords", value: fmt(discoveryKeywordCount) },
          { label: "Competitor Cache", value: fmt(competitorCacheCount) },
          { label: "Uncategorized Keywords", value: fmt(uncategorizedKeywordsCount) },
          { label: "User API Profiles", value: fmt(perUserUsageRows.length) },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{card.label}</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Domain Storage Coverage</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Per domain records across keyword and discovery stores.</p>
          </div>
          <div className="overflow-y-auto max-h-[300px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">Domain</th>
                  <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">Keywords</th>
                  <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">Discovery</th>
                  <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">Owner</th>
                </tr>
              </thead>
              <tbody>
                {domainStorageRows.map((row) => (
                  <tr key={`${row.domain}-${row.owner}`} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-xs font-semibold text-slate-700">{row.domain}</td>
                    <td className="px-4 py-2.5 text-right text-xs tabular-nums text-slate-600">{fmt(row.keywords)}</td>
                    <td className="px-4 py-2.5 text-right text-xs tabular-nums text-slate-600">{fmt(row.discovery)}</td>
                    <td className="px-4 py-2.5 text-[10px] text-slate-400">{row.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">API Use Case Capture</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Every provider call grouped by use case, with success/failure visibility.</p>
          </div>
          <div className="overflow-y-auto max-h-[300px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">Provider</th>
                  <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">Use Case</th>
                  <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">Total</th>
                  <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">Fail</th>
                </tr>
              </thead>
              <tbody>
                {useCaseRows.map((row) => (
                  <tr key={`${row.provider}-${row.useCase}`} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-[10px] font-black uppercase text-slate-500">{row.provider}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-slate-700">{row.useCase}</td>
                    <td className="px-4 py-2.5 text-right text-xs tabular-nums text-slate-700">{fmt(row.total)}</td>
                    <td className={`px-4 py-2.5 text-right text-xs tabular-nums font-black ${row.failed > 0 ? "text-rose-500" : "text-emerald-500"}`}>{fmt(row.failed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Top searched keywords */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Top Searched Keywords</h2>
          </div>
          {(topSearchedKws as { query: string; _count: { id: number } }[]).length === 0 ? (
            <div className="px-6 py-6 text-sm text-center text-slate-400">No search history yet.</div>
          ) : (
            <div className="overflow-y-auto max-h-[320px]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">Keyword</th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">Searches</th>
                  </tr>
                </thead>
                <tbody>
                  {(topSearchedKws as { query: string; _count: { id: number } }[]).map((row) => (
                    <tr key={row.query} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-xs font-medium text-slate-700">{row.query}</td>
                      <td className="px-4 py-2.5 text-right text-xs tabular-nums font-black text-[#f15b27]">{row._count.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent search history */}
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Recent User Searches ({fmt(userSearchCount)})</h2>
          </div>
          {(recentSearchHistory as { id: string; query: string; searchType: string; createdAt: Date; userId: string }[]).length === 0 ? (
            <div className="px-6 py-6 text-sm text-center text-slate-400">No search history stored yet.</div>
          ) : (
            <div className="overflow-y-auto max-h-[320px]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">Query</th>
                    <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">Type</th>
                    <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">User</th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">When</th>
                  </tr>
                </thead>
                <tbody>
                  {(recentSearchHistory as { id: string; query: string; searchType: string; createdAt: Date; userId: string }[]).map((row) => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-xs font-medium text-slate-700 max-w-[200px] truncate">{row.query}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">{row.searchType}</span>
                      </td>
                      <td className="px-4 py-2.5 text-[10px] text-slate-400">{userEmailMap.get(row.userId) ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right text-[10px] text-slate-400">{new Date(row.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Keyword Intelligence stored results */}
      <section className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Keyword Intelligence — Stored Results ({fmt(kwIntelCount)})</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Full API output saved per user per keyword lookup</p>
        </div>
        {recentKwIntel.length === 0 ? (
          <div className="px-6 py-6 text-sm text-center text-slate-400">No keyword intelligence records stored yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">Keyword</th>
                  <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">User</th>
                  <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">Volume</th>
                  <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">CPC</th>
                  <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">KD</th>
                  <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">Last Analyzed</th>
                </tr>
              </thead>
              <tbody>
                {recentKwIntel.map((kw) => (
                  <tr key={kw.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-xs font-semibold text-slate-800">{kw.keyword}</td>
                    <td className="px-4 py-2.5 text-[10px] text-slate-400">{(kw as { user?: { email?: string } }).user?.email ?? userEmailMap.get((kw as { userId?: string }).userId ?? "") ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right text-xs tabular-nums text-slate-600">{kw.searchVolume != null ? fmt(kw.searchVolume) : "—"}</td>
                    <td className="px-4 py-2.5 text-right text-xs tabular-nums text-slate-600">{kw.cpc != null ? `$${Number(kw.cpc).toFixed(2)}` : "—"}</td>
                    <td className="px-4 py-2.5 text-right text-xs tabular-nums">
                      {kw.difficulty != null ? (
                        <span className={`font-black ${kw.difficulty >= 70 ? "text-rose-500" : kw.difficulty >= 40 ? "text-amber-500" : "text-emerald-500"}`}>{kw.difficulty}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[10px] text-slate-400">{new Date(kw.lastAnalyzed).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── API USAGE REPORT ───────────────────────────────────────── */}
      <div>
        <h2 className="text-xs uppercase tracking-[0.18em] font-black text-[#f15b27] mb-3">API Usage Report</h2>
      </div>

      {/* API Usage */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top endpoints with cost */}
        <section className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Top API Endpoints</h2>
            <span className="text-xs font-black text-amber-600 bg-amber-50 rounded-lg px-2 py-1">${totalEstimatedCost.toFixed(2)} modeled total</span>
          </div>
          {topEndpoints.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-slate-400">
              No API calls logged yet. Calls are logged as users interact with the platform.
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[320px]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">Provider</th>
                    <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">Endpoint</th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">Calls</th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">Priced Calls</th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">Actual Cost</th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">Fallback</th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">Modeled</th>
                  </tr>
                </thead>
                <tbody>
                  {endpointCostRows.map((r) => (
                    <tr key={`${r.provider}-${r.endpoint}`} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-[10px] uppercase font-black text-slate-500">{r.provider}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-slate-700 break-all">{r.endpoint}</td>
                      <td className="px-4 py-2.5 text-right text-xs font-black text-[#f15b27] tabular-nums">{r.calls}</td>
                      <td className="px-4 py-2.5 text-right text-xs tabular-nums text-slate-500">{r.pricedCalls}</td>
                      <td className="px-4 py-2.5 text-right text-xs tabular-nums text-emerald-700">${r.actualCost.toFixed(3)}</td>
                      <td className="px-4 py-2.5 text-right text-xs tabular-nums text-slate-500">${r.fallbackCost.toFixed(3)}</td>
                      <td className="px-4 py-2.5 text-right text-xs tabular-nums text-amber-700 font-black">${r.estimated.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent API log */}
        <section className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Recent API Calls</h2>
          </div>
          {recentApiLogs.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-slate-400">
              No API calls logged yet.
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[320px]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">Endpoint</th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">Cost</th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">ms</th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">When</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApiLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-xs font-mono text-slate-700 break-all max-w-[260px]">{log.endpoint}</td>
                      <td className="px-4 py-2.5 text-right text-xs tabular-nums text-emerald-700">${parseLoggedApiCost((log as { responseJson?: string | null }).responseJson ?? null)?.toFixed(4) ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right text-xs tabular-nums text-slate-500">{log.durationMs ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">API Payload Inspector</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Stored request/response payload previews by user, domain, provider, and use case.</p>
        </div>
        {recentApiPayloads.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-slate-400">No API payload records available.</div>
        ) : (
          <div className="overflow-y-auto max-h-[420px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">When</th>
                  <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">Use Case</th>
                  <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">User / Domain</th>
                  <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">Payload</th>
                </tr>
              </thead>
              <tbody>
                {(recentApiPayloads as Array<{
                  id: string;
                  createdAt: Date;
                  provider: string;
                  useCase: string;
                  endpoint: string;
                  statusCode: number | null;
                  success: boolean;
                  resultCount: number | null;
                  requestJson: string | null;
                  responseJson: string | null;
                  user?: { email: string | null } | null;
                  site?: { domain: string } | null;
                }>).map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 align-top hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-[10px] text-slate-400">{new Date(row.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <div className="text-[10px] uppercase font-black text-slate-500">{row.provider}</div>
                      <div className="text-xs font-mono text-slate-700">{row.useCase}</div>
                      <div className="text-[10px] text-slate-400 max-w-[240px] truncate">{row.endpoint}</div>
                    </td>
                    <td className="px-4 py-2.5 text-[10px] text-slate-500">
                      <div>{row.user?.email ?? "—"}</div>
                      <div>{row.site?.domain ?? "no-site"}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs tabular-nums">
                      <div className={row.success ? "text-emerald-600 font-black" : "text-rose-500 font-black"}>{row.statusCode ?? "—"}</div>
                      <div className="text-[10px] text-slate-400">items: {row.resultCount ?? "—"}</div>
                    </td>
                    <td className="px-4 py-2.5 text-[10px] text-slate-600 max-w-[420px]">
                      <details>
                        <summary className="cursor-pointer text-[#f15b27] font-semibold">View request/response</summary>
                        <pre className="mt-1 whitespace-pre-wrap break-words bg-slate-50 rounded p-2 border border-slate-200">REQ: {(row.requestJson ?? "null").slice(0, 1200)}</pre>
                        <pre className="mt-1 whitespace-pre-wrap break-words bg-slate-50 rounded p-2 border border-slate-200">RES: {(row.responseJson ?? "null").slice(0, 1200)}</pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Per-User API Usage &amp; Cost</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Estimated spend and endpoint usage distribution by user account.</p>
        </div>
        {perUserUsageRows.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-slate-400">No per-user usage data yet.</div>
        ) : (
          <div className="overflow-y-auto max-h-[360px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">User</th>
                  <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">API Calls</th>
                  <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">Searches</th>
                  <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">Est. Cost</th>
                  <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">Top Endpoints</th>
                </tr>
              </thead>
              <tbody>
                {perUserUsageRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-xs font-medium text-slate-700">{row.email}</td>
                    <td className="px-4 py-2.5 text-right text-xs font-black tabular-nums text-[#f15b27]">{fmt(row.calls)}</td>
                    <td className="px-4 py-2.5 text-right text-xs tabular-nums text-slate-500">{fmt(row.searches)}</td>
                    <td className="px-4 py-2.5 text-right text-xs font-semibold tabular-nums text-amber-700">${row.estimatedCost.toFixed(3)}</td>
                    <td className="px-4 py-2.5 text-[10px] text-slate-500 max-w-[360px] truncate">{row.topEndpoints.join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Site management + Industry Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur p-6">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">Platform Links</h2>
          <div className="space-y-2 text-sm">
            {[
              { href: "/blog", label: "Blog" },
              { href: "/dashboard/decision-engine", label: "Decision Engine" },
              { href: "/dashboard/discover", label: "Keyword Discovery" },
              { href: "/dashboard/keyword-overview", label: "Keyword Overview" },
              { href: "/dashboard/competitor", label: "Competitor Intelligence" },
              { href: "/dashboard/traffic", label: "Traffic Checker" },
              { href: "/dashboard/site-audit", label: "Site Audit" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="block rounded-lg border border-slate-200 px-3 py-2 text-slate-600 hover:border-[#f15b27] hover:text-[#f15b27] transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur p-6">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">Industry Stats ({statCount})</h2>
          <SuperadminIndustryStatsManager initialStats={stats} />
        </section>
      </div>

      {/* AI Monitor */}
      <AiMonitorPanel />
    </div>
  );
}
