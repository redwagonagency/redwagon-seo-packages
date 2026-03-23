"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatNumber } from "@/lib/utils";

type CompetitorKeywordRow = {
  keyword: string;
  volume: number | null;
  yourPosition: number | null;
  competitorPosition: number | null;
  opportunity: string;
};

type CompetitorTargetKeyword = {
  keyword: string;
  url: string | null;
  position: number;
  searchVolume: number;
  traffic: number;
};

type CompetitorDataRow = {
  domain: string;
  competitorOverview: { organicTraffic: number; organicKeywords: number; etv: number } | null;
  gapKeywords: CompetitorKeywordRow[];
  competitorTargetKeywords: CompetitorTargetKeyword[];
};

type SpamScore = { target: string; spamScore: number };
type BacklinkCompetitor = { domain: string; intersections: number; relevantPages: number };
type SerpCompetitor = { domain: string; competitorMetrics?: { organicTraffic?: number; organicKeywords?: number } | null };

type CompetitorResponse = {
  domain: string;
  yourOverview: { organicTraffic: number; organicKeywords: number; etv: number } | null;
  competitorDomains: string[];
  suggestedCompetitors: { domain: string }[];
  spamScores: SpamScore[];
  backlinkCompetitors: BacklinkCompetitor[];
  serpCompetitors: SerpCompetitor[];
  competitorsData: CompetitorDataRow[];
};

type ActiveView = "overview" | "keywords" | "pages" | "backlink-competitors" | "serp-competitors";

function spamColor(s: number) {
  if (s >= 60) return "text-red-600 bg-red-50";
  if (s >= 30) return "text-amber-600 bg-amber-50";
  return "text-emerald-600 bg-emerald-50";
}

export default function CompetitorIntelligenceClient() {
  const searchParams = useSearchParams();
  const activeViewParam = searchParams?.get("view");
  const [activeTab, setActiveTab] = useState<ActiveView>(
    activeViewParam === "pages" ? "pages" : activeViewParam === "keywords" ? "keywords" : "overview"
  );
  const [domain, setDomain] = useState("");
  const [competitorInput, setCompetitorInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<CompetitorResponse | null>(null);

  async function loadData(nextDomain?: string, nextCompetitors?: string[]) {
    setLoading(true);
    setError("");
    try {
      const competitors = (nextCompetitors ?? competitorInput.split(/[,\n]/).map((d) => d.trim()).filter(Boolean)).slice(0, 5);
      const res = await fetch("/api/competitors/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: (nextDomain ?? domain).trim() || undefined,
          competitorDomains: competitors,
          useDefaultCompetitors: competitors.length === 0,
        }),
      });
      const json = (await res.json()) as CompetitorResponse & { error?: string };
      if (!res.ok) throw new Error(json.error || "Failed to load competitor intelligence");
      setData(json);
      setDomain(json.domain);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const parsedCustomCompetitors = useMemo(
    () => competitorInput.split(/[,\n]/).map((d) => d.trim()).filter(Boolean).slice(0, 5),
    [competitorInput]
  );

  const allGapKeywords = useMemo(
    () => (data?.competitorsData ?? []).flatMap((item) => item.gapKeywords.map((row) => ({ ...row, competitor: item.domain }))),
    [data?.competitorsData]
  );
  const allPages = useMemo(
    () => (data?.competitorsData ?? []).flatMap((item) => item.competitorTargetKeywords.map((row) => ({ ...row, competitor: item.domain }))),
    [data?.competitorsData]
  );

  const spamMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of data?.spamScores ?? []) m.set(s.target, s.spamScore);
    return m;
  }, [data?.spamScores]);

  const TABS: { id: ActiveView; label: string; count?: number }[] = [
    { id: "overview", label: "Overview", count: data?.competitorsData.length },
    { id: "keywords", label: "Gap Keywords", count: allGapKeywords.length },
    { id: "pages", label: "Top Pages", count: allPages.length },
    { id: "backlink-competitors", label: "Backlink Competitors", count: data?.backlinkCompetitors.length },
    { id: "serp-competitors", label: "SERP Competitors", count: data?.serpCompetitors.length },
  ];

  return (
    <div className="p-8 max-w-7xl">
      {/* Input bar */}
      <div className="rounded-xl border border-[#f15b27] bg-[#fff3ee] p-2 flex gap-2 mb-4 flex-wrap">
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="your-domain.com"
          className="rounded-md bg-white border border-slate-200 px-4 py-2.5 text-sm outline-none min-w-[200px] flex-1"
        />
        <textarea
          value={competitorInput}
          onChange={(e) => setCompetitorInput(e.target.value)}
          placeholder="Up to 5 competitor domains (comma or newline separated)"
          className="rounded-md bg-white border border-slate-200 px-4 py-2.5 text-sm outline-none min-h-[42px] max-h-[90px] flex-[2]"
        />
        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          className="rounded-md bg-[#f15b27] px-6 py-2.5 text-sm font-black text-white hover:bg-[#d94e1f] disabled:opacity-60 self-start"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>

      {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}

      {parsedCustomCompetitors.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {parsedCustomCompetitors.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 rounded-md border border-[#f15b27] bg-[#fff3ee] px-3 py-1 text-xs text-[#f15b27]">
              {c}
              {spamMap.has(c) && (
                <span className={`rounded px-1 py-0.5 text-[10px] font-bold ${spamColor(spamMap.get(c)!)}`}>
                  Spam {spamMap.get(c)}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      <h1 className="text-4xl font-black text-slate-900 mb-1">Competitor Analysis</h1>
      {data?.domain && <p className="text-sm text-slate-500 mb-1">Analyzing competitors for <strong>{data.domain}</strong></p>}

      {data && (
        <>
          {/* Tabs */}
          <div className="flex gap-0 border-b border-slate-200 mb-5 overflow-x-auto">
            {TABS.map((tab) => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? "border-[#f15b27] text-[#f15b27]" : "border-transparent text-slate-500 hover:text-slate-900"}`}>
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {activeTab === "overview" && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Competitor Domain</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Organic Keywords</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Organic Traffic</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Gap Keywords</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Spam Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.competitorsData.map((row) => (
                    <tr key={row.domain} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{row.domain}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.competitorOverview?.organicKeywords ?? 0)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.competitorOverview?.organicTraffic ?? 0)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.gapKeywords.length)}</td>
                      <td className="px-4 py-3 text-right">
                        {spamMap.has(row.domain) ? (
                          <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${spamColor(spamMap.get(row.domain)!)}`}>
                            {spamMap.get(row.domain)}
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                  {data.competitorsData.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">No competitor data. Enter competitor domains and click Analyze.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Keywords tab */}
          {activeTab === "keywords" && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Competitor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Keyword</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Volume</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Your Pos</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Comp Pos</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Opportunity</th>
                  </tr>
                </thead>
                <tbody>
                  {allGapKeywords.slice(0, 200).map((row, idx) => (
                    <tr key={`${row.competitor}-${row.keyword}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-500">{row.competitor}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{row.keyword}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.volume ?? 0)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{row.yourPosition ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{row.competitorPosition ?? "—"}</td>
                      <td className="px-4 py-3 text-right capitalize text-slate-600">{row.opportunity}</td>
                    </tr>
                  ))}
                  {allGapKeywords.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">No gap keywords yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pages tab */}
          {activeTab === "pages" && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Competitor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Page URL</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Position</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Volume</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Traffic</th>
                  </tr>
                </thead>
                <tbody>
                  {allPages.slice(0, 200).map((row, idx) => (
                    <tr key={`${row.competitor}-${row.url}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-500">{row.competitor}</td>
                      <td className="px-4 py-3 text-xs<br> text-[#f15b27] max-w-[320px] truncate">
                        <a href={row.url ?? "#"} target="_blank" rel="noopener noreferrer" className="hover:underline">{row.url}</a>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{row.position}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.searchVolume)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.traffic)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Backlink Competitors tab */}
          {activeTab === "backlink-competitors" && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs text-slate-500">Domains sharing the most common backlinks with <strong>{data.domain}</strong></p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Domain</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Shared Backlinks</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Relevant Pages</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.backlinkCompetitors ?? []).map((row) => (
                    <tr key={row.domain} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{row.domain}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.intersections)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.relevantPages)}</td>
                    </tr>
                  ))}
                  {(data.backlinkCompetitors ?? []).length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400">No backlink competitor data available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* SERP Competitors tab */}
          {activeTab === "serp-competitors" && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs text-slate-500">Domains competing for the same SERP positions as <strong>{data.domain}</strong></p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Domain</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Organic Keywords</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Organic Traffic</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.serpCompetitors ?? []).map((row) => (
                    <tr key={row.domain} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{row.domain}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.competitorMetrics?.organicKeywords ?? 0)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.competitorMetrics?.organicTraffic ?? 0)}</td>
                    </tr>
                  ))}
                  {(data.serpCompetitors ?? []).length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400">No SERP competitor data available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!data && !loading && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Enter your domain and up to 5 competitor domains, then click Analyze.
        </div>
      )}
    </div>
  );
}
