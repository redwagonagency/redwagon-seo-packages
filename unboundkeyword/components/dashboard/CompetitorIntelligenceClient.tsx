"use client";

import { useEffect, useMemo, useState } from "react";
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

type CompetitorResponse = {
  domain: string;
  yourOverview: { organicTraffic: number; organicKeywords: number; etv: number } | null;
  competitorDomains: string[];
  suggestedCompetitors: { domain: string }[];
  competitorsData: CompetitorDataRow[];
};

export default function CompetitorIntelligenceClient() {
  const searchParams = useSearchParams();
  const activeView = searchParams?.get("view") === "pages" ? "pages" : searchParams?.get("view") === "keywords" ? "keywords" : "overview";

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
      const res = await fetch("/api/traffic/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: (nextDomain ?? domain).trim() || undefined,
          competitorDomains: competitors,
        }),
      });
      const json = (await res.json()) as CompetitorResponse & { error?: string };
      if (!res.ok) throw new Error(json.error || "Failed to load competitor intelligence");
      setData(json);
      setDomain(json.domain);
      if (competitors.length === 0) setCompetitorInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load competitor intelligence");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

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

  return (
    <div className="p-8 max-w-7xl">
      <div className="rounded-xl border border-[#f15b27] bg-[#fff3ee] p-2 flex gap-2 mb-6">
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="your-domain.com"
          className="flex-1 rounded-md bg-white border border-slate-200 px-4 py-2.5 text-sm outline-none"
        />
        <textarea
          value={competitorInput}
          onChange={(e) => setCompetitorInput(e.target.value)}
          placeholder="Enter up to 5 custom competitor domains, comma or newline separated"
          className="flex-1 rounded-md bg-white border border-slate-200 px-4 py-2.5 text-sm outline-none min-h-[42px] max-h-[90px]"
        />
        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          className="rounded-md bg-[#f15b27] px-6 py-2.5 text-sm font-black text-white hover:bg-[#d94e1f] disabled:opacity-60"
        >
          Search
        </button>
      </div>

      {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}

      <h1 className="text-4xl font-black text-slate-900 mb-1">Competing Domains: <span className="font-semibold text-slate-500">{data?.domain}</span></h1>
      <p className="text-sm text-slate-500 mb-4">Custom competitors only. Add up to 5 domains and compare directly.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {parsedCustomCompetitors.length > 0 ? parsedCustomCompetitors.map((competitor) => (
          <span key={competitor} className="inline-flex items-center gap-2 rounded-md border border-[#f15b27] bg-[#fff3ee] px-3 py-1.5 text-xs text-[#f15b27]">{competitor}</span>
        )) : <span className="text-xs text-slate-500">No custom competitors entered yet.</span>}
      </div>

      {activeView === "overview" ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-5">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Competitor Domain</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Organic Keywords</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Organic Traffic</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Gap Keywords</th>
              </tr>
            </thead>
            <tbody>
              {(data?.competitorsData ?? []).map((row) => (
                <tr key={row.domain} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{row.domain}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.competitorOverview?.organicKeywords ?? 0)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.competitorOverview?.organicTraffic ?? 0)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.gapKeywords.length)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {activeView === "keywords" ? (
        <div className="mt-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full min-w-[980px] text-sm">
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
              {allGapKeywords.slice(0, 100).map((row, idx) => (
                <tr key={`${row.competitor}-${row.keyword}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{row.competitor}</td>
                  <td className="px-4 py-3 text-slate-800">{row.keyword}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.volume ?? 0)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{row.yourPosition ?? "-"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{row.competitorPosition ?? "-"}</td>
                  <td className="px-4 py-3 text-right capitalize text-slate-700">{row.opportunity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {activeView === "pages" ? (
        <div className="mt-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Competitor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Page URL</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Keyword</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Position</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Traffic</th>
              </tr>
            </thead>
            <tbody>
              {allPages.slice(0, 120).map((row, idx) => (
                <tr key={`${row.competitor}-${row.url}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{row.competitor}</td>
                  <td className="px-4 py-3 text-slate-700">{row.url ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-800">{row.keyword}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{row.position}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.traffic)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
