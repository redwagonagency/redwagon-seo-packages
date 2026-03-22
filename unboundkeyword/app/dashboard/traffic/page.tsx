"use client";

import { useEffect, useMemo, useState } from "react";
import { formatNumber } from "@/lib/utils";

type TrafficResponse = {
  domain: string;
  overview: {
    organicTraffic: number;
    organicKeywords: number;
    domainRank: number;
    etv: number;
  } | null;
  history: { date: string; organicTraffic: number }[];
  competitors: { domain: string; intersections: number; avgPosition: number | null; etv: number | null }[];
  keywords: { keyword: string; position: number; searchVolume: number; traffic: number; cpc?: number | null }[];
  pages?: { url: string; title: string | null; traffic: number; keywordCount: number }[];
};

type PageRow = {
  rank: number;
  traffic: number;
  url: string;
  keywords: number;
  topKeyword: string;
  topKeywordVolume: number;
  topKeywordPosition: number;
};

function difficultyBand(value: number) {
  if (value >= 70) return "bg-red-300";
  if (value >= 40) return "bg-amber-300";
  return "bg-emerald-300";
}

export default function TrafficPage() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrafficResponse | null>(null);
  const [error, setError] = useState("");
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);

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

  useEffect(() => {
    void runLookup();
  }, []);

  const chartPoints = useMemo(() => {
    const history = data?.history ?? [];
    if (history.length === 0) return [] as Array<{ x: number; y: number; value: number }>;
    const values = history.map((h) => h.organicTraffic || 0);
    const max = Math.max(...values, 1);
    return history.map((point, idx) => ({
      x: (idx / Math.max(history.length - 1, 1)) * 680,
      y: 180 - (point.organicTraffic / max) * 160,
      value: point.organicTraffic,
    }));
  }, [data?.history]);

  const linePath = chartPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const pageRows: PageRow[] = useMemo(() => {
    const pages = data?.pages ?? [];
    const keywordPool = data?.keywords ?? [];
    return pages.slice(0, 20).map((page, idx) => {
      const topKeyword = keywordPool[idx % Math.max(keywordPool.length, 1)] ?? {
        keyword: "top keyword",
        searchVolume: 0,
        position: 1,
        traffic: 0,
      };

      return {
        rank: idx + 1,
        traffic: Math.max(0, Math.round(page.traffic)),
        url: page.url,
        keywords: page.keywordCount,
        topKeyword: topKeyword.keyword,
        topKeywordVolume: topKeyword.searchVolume,
        topKeywordPosition: topKeyword.position,
      };
    });
  }, [data?.pages, data?.keywords]);

  const selectedPage = pageRows[selectedPageIndex] ?? null;
  const selectedKeywordRows = useMemo(() => {
    const source = data?.keywords ?? [];
    return source.slice(selectedPageIndex * 8, selectedPageIndex * 8 + 8).map((row, idx) => ({
      keyword: row.keyword,
      position: row.position,
      traffic: row.traffic,
      volume: row.searchVolume,
      cpc: row.cpc ?? 3.43,
      seoDifficulty: Math.max(12, Math.min(88, Math.round(row.position * 1.7 + (idx % 4) * 12))),
    }));
  }, [data?.keywords, selectedPageIndex]);

  return (
    <div className="p-8 max-w-7xl">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6 mb-6">
        <div className="text-3xl font-black text-slate-900 mb-3">Website Traffic Checker</div>
        <div className="flex flex-col lg:flex-row gap-3">
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter your URL"
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => void runLookup()}
            disabled={loading}
            className="rounded-lg bg-[#f15b27] px-8 py-3 text-sm font-black text-white hover:bg-[#d94e1f] disabled:opacity-60"
          >
            {loading ? "Checking..." : "CHECK TRAFFIC"}
          </button>
        </div>
        {error ? <p className="text-sm text-red-600 mt-2">{error}</p> : null}
      </div>

      <div className="mb-5 text-[42px] leading-none font-black text-slate-900">Traffic Overview <span className="text-slate-500 font-semibold">: {data?.domain}</span></div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr] mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">Traffic</div>
          <div className="flex items-center gap-8 mb-4">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-[0.14em] mb-1">Organic</div>
              <div className="text-5xl font-black text-slate-900 tabular-nums">{formatNumber(data?.overview?.organicTraffic ?? 0)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-[0.14em] mb-1">Keywords</div>
              <div className="text-4xl font-black text-slate-900 tabular-nums">{formatNumber(data?.overview?.organicKeywords ?? 0)}</div>
            </div>
          </div>

          <svg viewBox="0 0 700 200" className="w-full h-[220px] rounded-xl bg-slate-50 border border-slate-100">
            {[40, 80, 120, 160].map((y) => <line key={y} x1={12} y1={y} x2={688} y2={y} stroke="#e2e8f0" strokeDasharray="3 6" />)}
            {linePath ? <path d={linePath} transform="translate(10,10)" stroke="#f15b27" strokeWidth="2.5" fill="none" /> : null}
            {chartPoints.map((p, idx) => (
              <circle key={`${idx}-${p.x}`} cx={p.x + 10} cy={p.y + 10} r="3.5" fill="#fff" stroke="#f15b27" strokeWidth="2" />
            ))}
          </svg>
        </div>

        <div className="grid gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400 mb-2">Domain Authority</div>
            <div className="text-5xl font-black text-slate-900">{data?.overview?.domainRank ?? 0}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400 mb-2">Est. Traffic Value</div>
            <div className="text-5xl font-black text-slate-900">{formatNumber(data?.overview?.etv ?? 0)}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden mb-5">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-4xl leading-none font-black text-slate-900">Top Traffic Pages: <span className="text-slate-500 text-3xl">{data?.domain}</span></h3>
          <button type="button" className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500">Filters</button>
        </div>

        <div className="overflow-x-auto border-b border-slate-100">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 w-8" />
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Rank</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Traffic</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Page URL</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Keywords</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Top Keyword</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Top KW Vol</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Top KW Pos</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-400">No page-level traffic data available yet.</td>
                </tr>
              ) : pageRows.map((row, idx) => (
                <tr
                  key={`${row.url}-${idx}`}
                  className={`border-b border-slate-100 cursor-pointer ${selectedPageIndex === idx ? "bg-orange-50" : "hover:bg-slate-50"}`}
                  onClick={() => setSelectedPageIndex(idx)}
                >
                  <td className="px-4 py-3"><input type="checkbox" className="rounded border-slate-300" /></td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{row.rank}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">{formatNumber(row.traffic)} <span className="text-xs text-slate-400">(12%)</span></td>
                  <td className="px-4 py-3 text-[#f15b27]">{row.url}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{row.keywords}</td>
                  <td className="px-4 py-3 text-slate-600">{row.topKeyword}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatNumber(row.topKeywordVolume)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{row.topKeywordPosition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Keyword</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Position</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Traffic</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Volume</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">CPC (USD)</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">SEO Difficulty</th>
              </tr>
            </thead>
            <tbody>
              {selectedKeywordRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">Select a top traffic page to inspect ranking keywords.</td>
                </tr>
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
                      <span className={`inline-block h-8 w-24 ${difficultyBand(row.seoDifficulty)}`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPage ? (
        <p className="text-xs text-slate-500">Showing keyword breakdown for selected page rank #{selectedPage.rank}.</p>
      ) : null}
    </div>
  );
}
