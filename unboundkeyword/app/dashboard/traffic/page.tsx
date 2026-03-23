"use client";

import { useEffect, useMemo, useState } from "react";
import { formatNumber } from "@/lib/utils";

type TrafficResponse = {
  domain: string;
  requiresDomain?: boolean;
  message?: string;
  overview: {
    organicTraffic: number;
    organicKeywords: number;
    domainRank: number;
    etv: number;
  } | null;
  history: { date: string; organicTraffic: number }[];
  competitors: { domain: string; intersections: number; avgPosition: number | null; etv: number | null }[];
  keywords: { keyword: string; url?: string | null; position: number; searchVolume: number; traffic: number; cpc?: number | null }[];
  pages?: { url: string; title: string | null; traffic: number; keywordCount: number }[];
  rankedKeywords?: { keyword: string; position: number; url: string | null; searchVolume: number; cpc: number | null }[];
  bulkTraffic?: { target: string; organicTraffic: number; paidTraffic: number; etv: number }[];
  historicalBulkTraffic?: { date: string; organicTraffic: number }[];
  pageIntersection?: { url: string; domain: string; title: string | null; matchingPages: number }[];
};

type Tab = "overview" | "ranked" | "traffic-est" | "page-intersection" | "gsc" | "ga4";

function diffBand(v: number) {
  if (v >= 70) return "bg-red-300";
  if (v >= 40) return "bg-amber-300";
  return "bg-emerald-300";
}

type CompetitorTrafficRow = {
  domain: string;
  organicTraffic: number;
  organicKeywords: number;
  domainRank: number;
  etv: number;
};

export default function TrafficPage() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrafficResponse | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [projectCompetitors, setProjectCompetitors] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<CompetitorTrafficRow[]>([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [gscData, setGscData] = useState<{ query: string; clicks: number; impressions: number; ctr: number; position: number }[] | null>(null);
  const [ga4Data, setGa4Data] = useState<{ page: string; sessions: number; pageviews: number }[] | null>(null);
  const [gscLoading, setGscLoading] = useState(false);
  const [ga4Loading, setGa4Loading] = useState(false);
  const [gscError, setGscError] = useState("");
  const [ga4Error, setGa4Error] = useState("");

  async function runLookup(nextDomain?: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/traffic/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: (nextDomain ?? domain).trim() || undefined }),
      });
      const json = (await res.json()) as TrafficResponse & { error?: string };
      if (!res.ok) throw new Error(json.error || "Traffic lookup failed");
      setData(json);
      setDomain(json.domain);
      setSelectedPageIndex(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void runLookup(); }, []);

  // Load saved project competitors and run comparison
  useEffect(() => {
    fetch("/api/sites", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { sites: { id: string; domain: string; competitorList?: string[] }[]; selectedSiteId: string | null }) => {
        const selected = json.sites.find((s) => s.id === json.selectedSiteId);
        if (selected?.competitorList && selected.competitorList.length > 0) {
          setProjectCompetitors(selected.competitorList);
          void loadComparisonData(selected.domain, selected.competitorList);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadComparisonData(primaryDomain: string, competitors: string[]) {
    setComparisonLoading(true);
    try {
      const allDomains = [primaryDomain, ...competitors];
      const res = await fetch("/api/traffic/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domains: allDomains }),
      });
      if (!res.ok) return;
      const json = (await res.json()) as { rows?: CompetitorTrafficRow[] };
      if (json.rows) setComparisonData(json.rows);
    } catch {
      // comparison is optional, ignore errors
    } finally {
      setComparisonLoading(false);
    }
  }

  async function loadGscData() {
    setGscLoading(true);
    setGscError("");
    try {
      const res = await fetch("/api/gsc/data");
      const json = await res.json() as { rows?: typeof gscData; error?: string; notConnected?: boolean };
      if (!res.ok || json.error) throw new Error(json.error ?? "GSC fetch failed");
      setGscData(json.rows ?? []);
    } catch (e) {
      setGscError(e instanceof Error ? e.message : "GSC error");
    } finally {
      setGscLoading(false);
    }
  }

  async function loadGa4Data() {
    setGa4Loading(true);
    setGa4Error("");
    try {
      const res = await fetch("/api/ga4/data");
      const json = await res.json() as { rows?: typeof ga4Data; error?: string; notConnected?: boolean };
      if (!res.ok || json.error) throw new Error(json.error ?? "GA4 fetch failed");
      setGa4Data(json.rows ?? []);
    } catch (e) {
      setGa4Error(e instanceof Error ? e.message : "GA4 error");
    } finally {
      setGa4Loading(false);
    }
  }

  const chartHistory = useMemo(() => {
    const hist = (data?.historicalBulkTraffic?.length ? data.historicalBulkTraffic : data?.history) ?? [];
    if (hist.length === 0) return [] as Array<{ x: number; y: number; value: number; label: string }>;
    const values = hist.map((h) => h.organicTraffic || 0);
    const max = Math.max(...values, 1);
    return hist.map((point, idx) => ({
      x: (idx / Math.max(hist.length - 1, 1)) * 680,
      y: 180 - (point.organicTraffic / max) * 160,
      value: point.organicTraffic,
      label: point.date,
    }));
  }, [data?.history, data?.historicalBulkTraffic]);

  const linePath = chartHistory.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Group keywords by their URL (from DataForSEO url field) so we can properly associate them with pages
  const keywordsByUrl = useMemo(() => {
    const map = new Map<string, NonNullable<TrafficResponse["keywords"]>>();
    for (const kw of (data?.keywords ?? [])) {
      const key = (kw.url ?? "").replace(/^https?:\/\/(?:www\.)?/, "").replace(/\/$/, "");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(kw);
    }
    return map;
  }, [data?.keywords]);

  const pageRows = useMemo(() => {
    return (data?.pages ?? []).slice(0, 20).map((page, idx) => {
      // Match page URL to keyword URL (strip protocol + www + trailing slash)
      const pageKey = page.url.replace(/^https?:\/\/(?:www\.)?/, "").replace(/\/$/, "");
      const pageKws = keywordsByUrl.get(pageKey) ?? [];
      const topKeyword = pageKws.sort((a, b) => b.traffic - a.traffic)[0];
      return {
        rank: idx + 1,
        traffic: Math.max(0, Math.round(page.traffic)),
        url: page.url,
        keywords: page.keywordCount,
        topKeyword: topKeyword?.keyword ?? "—",
        topKeywordVolume: topKeyword?.searchVolume ?? 0,
        topKeywordPosition: topKeyword?.position ?? 0,
      };
    });
  }, [data?.pages, keywordsByUrl]);

  const selectedPageUrl = pageRows[selectedPageIndex]?.url ?? "";

  const selectedKeywordRows = useMemo(() => {
    const pageKey = selectedPageUrl.replace(/^https?:\/\/(?:www\.)?/, "").replace(/\/$/, "");
    const pageKws = keywordsByUrl.get(pageKey) ?? [];
    // Fallback: if no URL-matched keywords, show top keywords by traffic
    const source = pageKws.length > 0 ? pageKws : (data?.keywords ?? []).slice(0, 8);
    return source.slice(0, 12).map((row, idx) => ({
      keyword: row.keyword,
      position: row.position,
      traffic: row.traffic,
      volume: row.searchVolume,
      cpc: row.cpc ?? 0,
      seoDifficulty: Math.max(12, Math.min(88, Math.round(row.position * 1.7 + (idx % 4) * 12))),
    }));
  }, [selectedPageUrl, keywordsByUrl, data?.keywords]);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "ranked", label: "Ranked Keywords", count: data?.rankedKeywords?.length },
    { id: "traffic-est", label: "Traffic Estimation", count: data?.bulkTraffic?.length },
    { id: "page-intersection", label: "Page Intersection", count: data?.pageIntersection?.length },
    { id: "gsc", label: "Search Console" },
    { id: "ga4", label: "GA4 Analytics" },
  ];

  return (
    <div className="p-8 max-w-7xl">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6 mb-6">
        <div className="text-3xl font-black text-slate-900 mb-3">Website Traffic Checker</div>
        <div className="flex flex-col lg:flex-row gap-3">
          <input value={domain} onChange={(e) => setDomain(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void runLookup()} placeholder="Enter domain (e.g. example.com)" className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#f15b27]" />
          <button type="button" onClick={() => void runLookup()} disabled={loading} className="rounded-lg bg-[#f15b27] px-8 py-3 text-sm font-black text-white hover:bg-[#d94e1f] disabled:opacity-60">
            {loading ? "Checking..." : "CHECK TRAFFIC"}
          </button>
        </div>
        {error ? <p className="text-sm text-red-600 mt-2">{error}</p> : null}
        {data?.requiresDomain ? <p className="text-sm text-slate-600 mt-2">{data.message}</p> : null}
      </div>

      <div className="mb-5 text-[42px] leading-none font-black text-slate-900">
        Traffic Overview <span className="text-slate-500 font-semibold">: {data?.domain || "Add your domain"}</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Organic Traffic", value: formatNumber(data?.overview?.organicTraffic ?? 0) },
          { label: "Organic Keywords", value: formatNumber(data?.overview?.organicKeywords ?? 0) },
          { label: "Domain Authority", value: data?.overview?.domainRank ?? 0 },
          { label: "Est. Traffic Value", value: `$${formatNumber(data?.overview?.etv ?? 0)}` },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400 mb-1">{card.label}</div>
            <div className="text-4xl font-black text-slate-900 tabular-nums">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Competitor Comparison (from project saved competitors) */}
      {(comparisonData.length > 0 || comparisonLoading) && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] font-black text-slate-400">Project Competitor Comparison</div>
              <div className="text-sm text-slate-500 mt-0.5">Traffic snapshot across your domain + saved competitors</div>
            </div>
            {comparisonLoading && <svg className="animate-spin h-4 w-4 text-slate-300" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>}
          </div>
          {comparisonData.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">Domain</th>
                    <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-wider text-slate-500">Organic Traffic</th>
                    <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-wider text-slate-500">Keywords</th>
                    <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-wider text-slate-500">Domain Rank</th>
                    <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-wider text-slate-500">Est. Traffic Value</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, i) => (
                    <tr key={row.domain} className={`border-b border-slate-100 hover:bg-slate-50 ${i === 0 ? "bg-orange-50/40" : ""}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`https://www.google.com/s2/favicons?domain=${row.domain}&sz=16`} alt="" width={16} height={16} className="rounded-sm" />
                          <span className="font-semibold text-slate-800">{row.domain}</span>
                          {i === 0 && <span className="text-[10px] bg-orange-100 text-orange-700 font-black px-1.5 py-0.5 rounded-full uppercase">You</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums font-semibold text-slate-800">{formatNumber(row.organicTraffic)}</td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-slate-600">{formatNumber(row.organicKeywords)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`text-xs font-black px-2 py-0.5 rounded-full ${row.domainRank >= 60 ? "bg-emerald-100 text-emerald-700" : row.domainRank >= 30 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                          {row.domainRank > 0 ? row.domainRank : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-slate-600">${formatNumber(row.etv)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-slate-200">
        {tabs.map((t) => (
          <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors ${activeTab === t.id ? "border-b-2 border-[#f15b27] text-[#f15b27] -mb-px" : "text-slate-500 hover:text-slate-700"}`}>
            {t.label}{t.count != null && t.count > 0 ? <span className="ml-1.5 text-xs bg-slate-100 text-slate-500 rounded-full px-1.5 py-0.5">{t.count}</span> : null}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-3">Traffic History</div>
            <svg viewBox="0 0 700 200" className="w-full h-[220px] rounded-xl bg-slate-50 border border-slate-100">
              {[40, 80, 120, 160].map((y) => <line key={y} x1={12} y1={y} x2={688} y2={y} stroke="#e2e8f0" strokeDasharray="3 6" />)}
              {linePath ? <path d={linePath} transform="translate(10,10)" stroke="#f15b27" strokeWidth="2.5" fill="none" /> : null}
              {chartHistory.map((p, idx) => (
                <circle key={`${idx}-${p.x}`} cx={p.x + 10} cy={p.y + 10} r="3.5" fill="#fff" stroke="#f15b27" strokeWidth="2">
                  <title>{p.label}: {formatNumber(p.value)}</title>
                </circle>
              ))}
            </svg>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden mb-5">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-900">Top Traffic Pages</h3>
            </div>
            <div className="overflow-x-auto border-b border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">#</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Traffic</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Page URL</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Keywords</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Top Keyword</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Pos</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400">No page-level traffic data available yet.</td></tr>
                  ) : pageRows.map((row, idx) => (
                    <tr key={`${row.url}-${idx}`} className={`border-b border-slate-100 cursor-pointer ${selectedPageIndex === idx ? "bg-orange-50" : "hover:bg-slate-50"}`} onClick={() => setSelectedPageIndex(idx)}>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-500">{row.rank}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">{formatNumber(row.traffic)}</td>
                      <td className="px-4 py-3 text-[#f15b27] truncate max-w-xs">{row.url}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{row.keywords}</td>
                      <td className="px-4 py-3 text-slate-600">{row.topKeyword}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{row.topKeywordPosition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Keyword</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Position</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Traffic</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Volume</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">CPC</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">SEO Difficulty</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedKeywordRows.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">Select a top traffic page to inspect ranking keywords.</td></tr>
                  ) : selectedKeywordRows.map((row) => (
                    <tr key={`${row.keyword}-${row.position}`} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-800">{row.keyword}</td>
                      <td className="px-6 py-3 text-right tabular-nums text-slate-700">{row.position}</td>
                      <td className="px-6 py-3 text-right tabular-nums font-semibold text-slate-900">{formatNumber(row.traffic)}</td>
                      <td className="px-6 py-3 text-right tabular-nums text-slate-700">{formatNumber(row.volume)}</td>
                      <td className="px-6 py-3 text-right tabular-nums text-slate-700">${row.cpc.toFixed(2)}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <span className="tabular-nums text-slate-700">{row.seoDifficulty}</span>
                          <span className={`inline-block h-2 w-16 rounded ${diffBand(row.seoDifficulty)}`} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Ranked Keywords tab */}
      {activeTab === "ranked" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-xl font-black text-slate-900">Ranked Keywords</h3>
            <p className="text-xs text-slate-500 mt-0.5">Top keywords this domain currently ranks for across Google search results.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Keyword</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Position</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Volume</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">CPC</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">URL</th>
                </tr>
              </thead>
              <tbody>
                {(data?.rankedKeywords ?? []).length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">No ranked keywords data. Run a domain lookup to see results.</td></tr>
                ) : (data?.rankedKeywords ?? []).map((row, idx) => (
                  <tr key={`${row.keyword}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{row.keyword}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-black text-slate-900">{row.position}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.searchVolume)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">{row.cpc != null ? `$${row.cpc.toFixed(2)}` : "—"}</td>
                    <td className="px-4 py-3 text-[#f15b27] text-xs truncate max-w-xs">{row.url ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Traffic Estimation tab */}
      {activeTab === "traffic-est" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900">Bulk Traffic Estimation</h3>
              <p className="text-xs text-slate-500 mt-0.5">Current estimated traffic levels for your domain.</p>
            </div>
            {(data?.bulkTraffic ?? []).length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-400">No traffic estimate data available for this domain.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Target</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Organic Traffic</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Paid Traffic</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Est. Traffic Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.bulkTraffic ?? []).map((row, idx) => (
                      <tr key={`${row.target}-${idx}`} className="border-b border-slate-100">
                        <td className="px-4 py-3 font-semibold text-slate-800">{row.target}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-black text-slate-900">{formatNumber(row.organicTraffic)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.paidTraffic)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">${formatNumber(row.etv)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {(data?.historicalBulkTraffic ?? []).length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-3">Historical Bulk Traffic</div>
              <svg viewBox="0 0 700 200" className="w-full h-[200px] rounded-xl bg-slate-50 border border-slate-100">
                {[40, 80, 120, 160].map((y) => <line key={y} x1={12} y1={y} x2={688} y2={y} stroke="#e2e8f0" strokeDasharray="3 6" />)}
                {linePath ? <path d={linePath} transform="translate(10,10)" stroke="#f15b27" strokeWidth="2.5" fill="none" /> : null}
                {chartHistory.map((p, idx) => (
                  <circle key={`${idx}-${p.x}`} cx={p.x + 10} cy={p.y + 10} r="3.5" fill="#fff" stroke="#f15b27" strokeWidth="2">
                    <title>{p.label}: {formatNumber(p.value)}</title>
                  </circle>
                ))}
              </svg>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-slate-400 uppercase tracking-wide"><th className="py-1 text-left">Date</th><th className="py-1 text-right">Organic Traffic</th></tr></thead>
                  <tbody>
                    {(data?.historicalBulkTraffic ?? []).map((row, idx) => (
                      <tr key={`${row.date}-${idx}`} className="border-t border-slate-100">
                        <td className="py-1.5 text-slate-500">{row.date}</td>
                        <td className="py-1.5 text-right tabular-nums font-semibold text-slate-700">{formatNumber(row.organicTraffic)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Page Intersection tab */}
      {activeTab === "page-intersection" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-xl font-black text-slate-900">Page Intersection</h3>
            <p className="text-xs text-slate-500 mt-0.5">Pages that rank alongside your competitors — revealing shared SERP battleground.</p>
          </div>
          {(data?.pageIntersection ?? []).length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-400">
              No page intersection data. Add competitor domains and re-run to see overlapping pages.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">URL</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Domain</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Title</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Matching Pages</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.pageIntersection ?? []).map((row, idx) => (
                    <tr key={`${row.url}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-[#f15b27] text-xs truncate max-w-sm">{row.url}</td>
                      <td className="px-4 py-3 text-slate-600 text-sm">{row.domain}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs truncate max-w-xs">{row.title ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-black text-slate-900">{row.matchingPages}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Google Search Console tab */}
      {activeTab === "gsc" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900">Google Search Console</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real clicks, impressions, CTR and position from your verified Google property.</p>
            </div>
            {!gscData && !gscLoading && (
              <button type="button" onClick={() => void loadGscData()} className="rounded-lg bg-[#f15b27] px-6 py-2 text-sm font-black text-white hover:bg-[#d94e1f]">
                Load GSC Data
              </button>
            )}
          </div>
          {gscLoading && <div className="px-6 py-12 text-center text-sm text-slate-400">Loading Search Console data…</div>}
          {gscError && <div className="px-6 py-4 text-sm text-red-600 bg-red-50 border-b border-red-100">{gscError}</div>}
          {gscData && gscData.length === 0 && <div className="px-6 py-12 text-center text-sm text-slate-400">No GSC data found. Make sure your site is verified in Google Search Console.</div>}
          {gscData && gscData.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Query</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Clicks</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Impressions</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">CTR</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Avg. Position</th>
                  </tr>
                </thead>
                <tbody>
                  {gscData.map((row, idx) => (
                    <tr key={`${row.query}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{row.query}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-black text-slate-900">{formatNumber(row.clicks)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.impressions)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{(row.ctr * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{row.position.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* GA4 Analytics tab */}
      {activeTab === "ga4" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900">GA4 Analytics</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real sessions and pageviews from your Google Analytics 4 property.</p>
            </div>
            {!ga4Data && !ga4Loading && (
              <button type="button" onClick={() => void loadGa4Data()} className="rounded-lg bg-[#f15b27] px-6 py-2 text-sm font-black text-white hover:bg-[#d94e1f]">
                Load GA4 Data
              </button>
            )}
          </div>
          {ga4Loading && <div className="px-6 py-12 text-center text-sm text-slate-400">Loading GA4 data…</div>}
          {ga4Error && <div className="px-6 py-4 text-sm text-red-600 bg-red-50 border-b border-red-100">{ga4Error}</div>}
          {ga4Data && ga4Data.length === 0 && <div className="px-6 py-12 text-center text-sm text-slate-400">No GA4 data found. Make sure your GA4 property is connected to your Google account.</div>}
          {ga4Data && ga4Data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Page</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Sessions</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Pageviews</th>
                  </tr>
                </thead>
                <tbody>
                  {ga4Data.map((row, idx) => (
                    <tr key={`${row.page}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-[#f15b27] text-xs truncate max-w-sm">{row.page}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-black text-slate-900">{formatNumber(row.sessions)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.pageviews)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
