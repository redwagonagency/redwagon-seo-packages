"use client";

import { useEffect, useMemo, useState } from "react";
import { formatNumber } from "@/lib/utils";

type TrafficResponse = {
  domain: string;
  overview: { organicTraffic: number; organicKeywords: number } | null;
  history: { date: string; organicTraffic: number }[];
  competitors: { domain: string; intersections: number; avgPosition: number | null; etv: number | null }[];
  keywords: { keyword: string; position: number; searchVolume: number; traffic: number; cpc?: number | null }[];
};

export default function CompetitorIntelligenceClient() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrafficResponse | null>(null);
  const [activeCompetitor, setActiveCompetitor] = useState<string | null>(null);
  const [competitorData, setCompetitorData] = useState<TrafficResponse | null>(null);

  async function loadBase(nextDomain?: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/traffic/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: (nextDomain ?? domain).trim() || undefined }),
      });
      const json = (await res.json()) as TrafficResponse;
      setData(json);
      setDomain(json.domain);
      if (!activeCompetitor && json.competitors?.[0]?.domain) {
        setActiveCompetitor(json.competitors[0].domain);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadCompetitor(competitorDomain: string) {
    setActiveCompetitor(competitorDomain);
    const res = await fetch("/api/traffic/overview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: competitorDomain }),
    });
    const json = (await res.json()) as TrafficResponse;
    setCompetitorData(json);
  }

  useEffect(() => {
    void loadBase();
  }, []);

  useEffect(() => {
    if (activeCompetitor) void loadCompetitor(activeCompetitor);
  }, [activeCompetitor]);

  const chartSeries = useMemo(() => {
    const base = data?.history ?? [];
    const competitor = competitorData?.history ?? [];
    const size = Math.max(base.length, competitor.length);
    const merged = Array.from({ length: size }, (_, idx) => ({
      date: base[idx]?.date ?? competitor[idx]?.date ?? `M${idx + 1}`,
      base: base[idx]?.organicTraffic ?? 0,
      competitor: competitor[idx]?.organicTraffic ?? 0,
    }));
    const max = Math.max(1, ...merged.flatMap((item) => [item.base, item.competitor]));

    const toPath = (key: "base" | "competitor") =>
      merged
        .map((point, idx) => {
          const x = (idx / Math.max(merged.length - 1, 1)) * 780;
          const y = 220 - ((point[key] || 0) / max) * 180;
          return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
        })
        .join(" ");

    return {
      merged,
      basePath: toPath("base"),
      competitorPath: toPath("competitor"),
    };
  }, [data?.history, competitorData?.history]);

  const activeKeywordRows = competitorData?.keywords?.length ? competitorData.keywords : data?.keywords ?? [];

  return (
    <div className="p-8 max-w-7xl">
      <div className="rounded-xl border border-[#f15b27] bg-[#fff3ee] p-2 flex gap-2 mb-6">
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="domain.com"
          className="flex-1 rounded-md bg-white border border-slate-200 px-4 py-2.5 text-sm outline-none"
        />
        <button
          type="button"
          onClick={() => void loadBase()}
          disabled={loading}
          className="rounded-md bg-[#f15b27] px-6 py-2.5 text-sm font-black text-white hover:bg-[#d94e1f] disabled:opacity-60"
        >
          Search
        </button>
      </div>

      <h1 className="text-4xl font-black text-slate-900 mb-1">Competing Domains: <span className="font-semibold text-slate-500">{data?.domain}</span></h1>
      <p className="text-sm text-slate-500 mb-4">Here are the domains that rank for similar keywords.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {(data?.competitors ?? []).map((competitor) => (
          <button
            key={competitor.domain}
            type="button"
            onClick={() => setActiveCompetitor(competitor.domain)}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs ${
              activeCompetitor === competitor.domain
                ? "border-[#f15b27] bg-[#fff3ee] text-[#f15b27]"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {competitor.domain}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 mb-2">Monthly Traffic</div>
        <svg viewBox="0 0 820 250" className="w-full h-[280px] bg-slate-50 rounded-lg border border-slate-100">
          {[50, 90, 130, 170, 210].map((y) => <line key={y} x1={20} y1={y} x2={800} y2={y} stroke="#e2e8f0" strokeDasharray="3 5" />)}
          {chartSeries.basePath ? <path d={chartSeries.basePath} transform="translate(20,10)" fill="none" stroke="#f15b27" strokeWidth="2.4" /> : null}
          {chartSeries.competitorPath ? <path d={chartSeries.competitorPath} transform="translate(20,10)" fill="none" stroke="#6366f1" strokeWidth="2" /> : null}
        </svg>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Competitor Domain</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Common Keywords</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Keywords Gap</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Estimated Traffic</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Backlinks</th>
            </tr>
          </thead>
          <tbody>
            {(data?.competitors ?? []).map((row) => (
              <tr key={row.domain} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">{row.domain}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.intersections)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(Math.max(0, (data?.overview?.organicKeywords ?? 0) - row.intersections))}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(Math.round(row.etv ?? 0))}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(Math.round((row.etv ?? 0) * 4.2))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Keyword</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Volume</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Position</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Est. Visits</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">CPC</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Paid Difficulty</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">SEO Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {activeKeywordRows.slice(0, 20).map((row) => (
              <tr key={`${row.keyword}-${row.position}`} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{row.keyword}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.searchVolume)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">{row.position}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.traffic)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">${((row.cpc ?? 1.12)).toFixed(2)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">{Math.max(1, Math.round((row.position / 100) * 14))}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">{Math.max(10, Math.min(90, Math.round((row.position / 100) * 60 + 30)))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
