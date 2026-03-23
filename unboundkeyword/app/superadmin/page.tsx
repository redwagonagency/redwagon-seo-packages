import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isJoeSuperAdmin } from "@/lib/superadmin";
import SuperadminIndustryStatsManager from "@/components/dashboard/SuperadminIndustryStatsManager";

export const dynamic = "force-dynamic";

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
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
      by: ["endpoint"],
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

  // DataForSEO estimated cost per call by endpoint pattern
  const ENDPOINT_COSTS: Record<string, number> = {
    "/serp/google/organic/live/advanced": 0.0025,
    "/serp/google/autocomplete/live/advanced": 0.0005,
    "/keywords_data/google_ads/search_volume/live": 0.002,
    "/keywords_data/google_ads/keywords_for_keywords/live": 0.002,
    "/keywords_data/google_ads/keywords_for_site/live": 0.002,
    "/keywords_data/dataforseo_trends/demography/live": 0.002,
    "/dataforseo_labs/google/keywords_for_keywords/live": 0.0015,
    "/dataforseo_labs/google/ranked_keywords/live": 0.0015,
    "/dataforseo_labs/google/bulk_keyword_difficulty/live": 0.001,
    "/content_analysis/search/live": 0.01,
    "/backlinks/bulk_ranks/live": 0.003,
    "/backlinks/anchors/live": 0.003,
  };

  const endpointCostRows = topEndpoints.map((ep) => {
    const costPerCall = Object.entries(ENDPOINT_COSTS).find(([k]) => ep.endpoint.includes(k))?.[1] ?? 0.001;
    return { endpoint: ep.endpoint, calls: ep._count.id, estimated: ep._count.id * costPerCall };
  });
  const totalEstimatedCost = endpointCostRows.reduce((s, e) => s + e.estimated, 0);

  return (
    <div className="p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-[#f15b27] font-black">Superadmin</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">SAAS Control Center</h1>
        <p className="mt-1 text-sm text-slate-500">Platform-wide metrics, stored data output, API usage &amp; cost estimates</p>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        {[
          { label: "Total Users", value: fmt(userCount), sub: `+${newUsersThisMonth} this month`, color: "text-emerald-500" },
          { label: "Projects", value: fmt(projectCount) },
          { label: "Tracked Keywords", value: fmt(keywordCount) },
          { label: "KW Intelligence", value: fmt(kwIntelCount), sub: "stored records" },
          { label: "Search History", value: fmt(userSearchCount), sub: "user searches" },
          { label: "Industry Stats", value: fmt(statCount) },
          { label: "API Calls", value: fmt(apiLogCount), sub: `~$${totalEstimatedCost.toFixed(2)} est.`, color: "text-amber-500" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
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
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
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
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
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

      {/* Top searched keywords */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
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
      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
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
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Top API Endpoints</h2>
            <span className="text-xs font-black text-amber-600 bg-amber-50 rounded-lg px-2 py-1">~${totalEstimatedCost.toFixed(2)} total est.</span>
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
                    <th className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">Endpoint</th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">Calls</th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">Est. Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {endpointCostRows.map((r) => (
                    <tr key={r.endpoint} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-xs font-mono text-slate-700 break-all">{r.endpoint}</td>
                      <td className="px-4 py-2.5 text-right text-xs font-black text-[#f15b27] tabular-nums">{r.calls}</td>
                      <td className="px-4 py-2.5 text-right text-xs tabular-nums text-amber-700">${r.estimated.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent API log */}
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
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
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">ms</th>
                    <th className="px-4 py-2.5 text-right text-xs font-black uppercase tracking-wider text-slate-400">When</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApiLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-xs font-mono text-slate-700 break-all max-w-[260px]">{log.endpoint}</td>
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

      {/* Site management + Industry Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
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

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">Industry Stats ({statCount})</h2>
          <SuperadminIndustryStatsManager initialStats={stats} />
        </section>
      </div>
    </div>
  );
}
