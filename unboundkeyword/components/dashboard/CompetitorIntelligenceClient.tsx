"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { formatNumber } from "@/lib/utils";
import type { CompetitorAnalysisResponse, CompetitorRow, RankedKwItem } from "@/app/api/competitors/intelligence/route";

// Color palette matching Ubersuggest style
const COLORS = ["#f15b27", "#22c55e", "#a855f7", "#3b82f6", "#06b6d4", "#f59e0b", "#ec4899", "#14b8a6", "#8b5cf6", "#ef4444"];

type KwModalType = "common" | "gap" | "ranked" | "yours" | null;

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function KwModal({
  type, competitor, rows, rankedRows, onClose
}: {
  type: KwModalType;
  competitor: string;
  rows: { keyword: string; volume: number | null; yourPosition: number | null; competitorPosition: number | null; opportunity?: string }[];
  rankedRows?: RankedKwItem[];
  onClose: () => void;
}) {
  if (!type) return null;
  const isRanked = type === "ranked" || type === "yours";
  const title = type === "common" ? "Common Keywords" : type === "gap" ? "Keyword Gap" : type === "yours" ? "Your Ranked Keywords" : "Competitor Ranked Keywords";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] font-black text-[#f15b27]">{title}</div>
            <h3 className="text-lg font-black text-slate-900">{competitor}</h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {isRanked ? (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Keyword</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Pos</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Volume</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">CPC</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">URL</th>
                </tr>
              </thead>
              <tbody>
                {(rankedRows ?? []).length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">No data available.</td></tr>
                ) : (rankedRows ?? []).map((r, i) => (
                  <tr key={`${r.keyword}-${i}`} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{r.keyword}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      <span className={`text-xs font-black px-1.5 py-0.5 rounded-full ${r.position <= 3 ? "bg-emerald-100 text-emerald-700" : r.position <= 10 ? "bg-blue-100 text-blue-700" : r.position <= 20 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                        #{r.position}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{r.searchVolume > 0 ? formatCompact(r.searchVolume) : "—"}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{r.cpc != null ? `$${r.cpc.toFixed(2)}` : "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-400 truncate max-w-[160px]">{r.url ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Keyword</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Volume</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Your Pos</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Their Pos</th>
                  {type === "gap" && <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Gap</th>}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">No data available.</td></tr>
                ) : rows.map((r, i) => (
                  <tr key={`${r.keyword}-${i}`} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{r.keyword}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{r.volume != null ? formatCompact(r.volume) : "—"}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{r.yourPosition ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{r.competitorPosition ?? "—"}</td>
                    {type === "gap" && (
                      <td className="px-4 py-2.5 text-right">
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full capitalize ${r.opportunity === "missing" ? "bg-red-100 text-red-700" : r.opportunity === "weak" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {r.opportunity ?? "—"}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function downloadCSV(domain: string, rows: CompetitorRow[]) {
  const headers = ["Competitor Domain", "Common Keywords", "Keyword Gap", "Estimated Traffic", "Backlinks", "Referring Domains", "Domain Rank"];
  const lines = [
    headers.join(","),
    ...rows.map((r) => [
      r.domain,
      r.commonKeywordsCount,
      r.keywordGapCount,
      r.estimatedTraffic,
      r.backlinks,
      r.referringDomains,
      r.domainRank,
    ].join(","))
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `competitor-analysis-${domain}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

export default function CompetitorIntelligenceClient() {
  const [domainInput, setDomainInput] = useState("");
  const [competitorInputs, setCompetitorInputs] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<CompetitorAnalysisResponse | null>(null);
  const [activeCompetitors, setActiveCompetitors] = useState<Set<string>>(new Set());
  const [modalState, setModalState] = useState<{ type: KwModalType; row: CompetitorRow | null }>({ type: null, row: null });
  const [yourKwOpen, setYourKwOpen] = useState(false);
  const [projectDomain, setProjectDomain] = useState<string | null>(null);
  const didLoad = useRef(false);

  // Auto-load project domain and saved competitors
  useEffect(() => {
    fetch("/api/sites", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { sites: { id: string; domain: string; competitorList?: string[] }[]; selectedSiteId: string | null }) => {
        const selected = json.sites.find((s) => s.id === json.selectedSiteId);
        if (selected) {
          setProjectDomain(selected.domain);
          // Pre-fill saved competitors
          if (selected.competitorList && selected.competitorList.length > 0) {
            setCompetitorInputs(selected.competitorList);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Auto-run when project domain is known (using saved competitors or none)
  useEffect(() => {
    if (projectDomain && !didLoad.current) {
      didLoad.current = true;
      // competitorInputs may have been pre-filled; pass them through
      void runAnalysis(projectDomain, undefined);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectDomain]);

  async function runAnalysis(domain?: string, competitors?: string[]) {
    setLoading(true);
    setError("");
    const domainToUse = domain ?? domainInput.trim();
    const compsToUse = (competitors ?? competitorInputs).map((d) => d.trim()).filter(Boolean);
    try {
      const res = await fetch("/api/competitors/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: domainToUse || undefined,
          competitorDomains: compsToUse.length > 0 ? compsToUse : undefined,
        }),
      });
      const json = (await res.json()) as CompetitorAnalysisResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Analysis failed");
      setData(json);
      if (domainToUse) setDomainInput(domainToUse);
      // Activate all returned competitors by default
      setActiveCompetitors(new Set(json.competitors.map((c) => c.domain)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  const domain = data?.domain ?? "";
  const allDomains = useMemo(() => [domain, ...(!data ? [] : data.competitors.map((c) => c.domain))], [domain, data]);

  const chartData = useMemo(() => {
    if (!data?.monthlyTraffic?.length) return [];
    return data.monthlyTraffic.slice(-13).map((point) => ({
      ...point,
      label: typeof point.date === "string" ? point.date.slice(0, 7) : String(point.date),
    }));
  }, [data?.monthlyTraffic]);

  const activeRows = useMemo(
    () => (data?.competitors ?? []).filter((c) => activeCompetitors.has(c.domain)),
    [data?.competitors, activeCompetitors]
  );

  function toggleCompetitor(d: string) {
    setActiveCompetitors((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d); else next.add(d);
      return next;
    });
  }

  const modalRows = useMemo(() => {
    if (!modalState.row) return [];
    return modalState.type === "common" ? modalState.row.commonKeywords : modalState.row.keywordGap;
  }, [modalState]);

  // For "ranked" type: all keywords the competitor appears for (common + gap), sorted by position
  const modalRankedRows = useMemo((): RankedKwItem[] => {
    if (modalState.type !== "ranked" || !modalState.row) return [];
    const row = modalState.row;
    const combined: RankedKwItem[] = [
      ...row.commonKeywords.map((k) => ({
        keyword: k.keyword,
        position: k.competitorPosition ?? 999,
        searchVolume: k.volume ?? 0,
        cpc: null,
        url: null,
      })),
      ...row.keywordGap.map((k) => ({
        keyword: k.keyword,
        position: k.competitorPosition ?? 999,
        searchVolume: k.volume ?? 0,
        cpc: null,
        url: null,
      })),
    ];
    return combined.sort((a, b) => a.position - b.position || b.searchVolume - a.searchVolume);
  }, [modalState]);

  return (
    <div className="p-6 max-w-7xl">
      {/* Search bar */}
      <div className="rounded-2xl border border-[#f15b27] bg-white px-4 py-3 flex flex-wrap gap-3 items-center mb-5">
        <input
          value={domainInput}
          onChange={(e) => setDomainInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void runAnalysis()}
          placeholder={projectDomain ?? "Enter domain (e.g. neilpatel.com)"}
          className="flex-1 min-w-[200px] rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-[#f15b27]"
        />
        <div className="flex gap-2 flex-wrap">
          {competitorInputs.map((val, idx) => (
            <input
              key={idx}
              value={val}
              onChange={(e) => {
                const next = [...competitorInputs];
                next[idx] = e.target.value;
                setCompetitorInputs(next);
              }}
              onKeyDown={(e) => e.key === "Enter" && void runAnalysis()}
              placeholder={`Competitor ${idx + 1}`}
              className="w-44 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#f15b27]"
            />
          ))}
          {competitorInputs.length < 10 && (
            <button
              type="button"
              onClick={() => setCompetitorInputs([...competitorInputs, ""])}
              className="w-9 h-10 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 hover:text-[#f15b27] hover:border-[#f15b27] font-black text-lg flex items-center justify-center"
            >+</button>
          )}
        </div>
        <button
          type="button"
          onClick={() => void runAnalysis()}
          disabled={loading}
          className="rounded-lg bg-[#f15b27] px-8 py-2.5 text-sm font-black text-white hover:bg-[#d94e1f] disabled:opacity-60 whitespace-nowrap"
        >
          {loading ? "Analyzing…" : "Search"}
        </button>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {!data && !loading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-slate-400 text-sm">
          {projectDomain ? `Loading competitor analysis for ${projectDomain}…` : "Enter a domain above to analyze competitors."}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 flex items-center justify-center gap-3 text-slate-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Fetching competitor data across multiple APIs…
        </div>
      )}

      {data && !loading && (
        <>
          {/* Header */}
          <div className="mb-2">
            <h1 className="text-2xl font-black text-slate-900">Competitor Analysis: <span className="text-[#f15b27]">{domain}</span></h1>
            <p className="text-sm text-slate-500">Here are the domains that rank for similar keywords</p>
          </div>

          {/* Competitor toggle chips */}
          {data.competitors.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {data.competitors.map((c, i) => {
                const color = COLORS[(i + 1) % COLORS.length];
                const active = activeCompetitors.has(c.domain);
                return (
                  <button
                    key={c.domain}
                    type="button"
                    onClick={() => toggleCompetitor(c.domain)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${active ? "bg-white shadow-sm" : "opacity-40 bg-slate-50"}`}
                    style={{ borderColor: color, color }}
                  >
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
                    {c.domain}
                    <span className="text-slate-300 hover:text-slate-500 ml-0.5">×</span>
                  </button>
                );
              })}
              {/* Your domain chip */}
              <button
                type="button"
                onClick={() => setYourKwOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold bg-white shadow-sm hover:bg-[#fff3ee] transition-colors"
                style={{ borderColor: COLORS[0], color: COLORS[0] }}
              >
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: COLORS[0] }} />
                {domain} (you) — {data.yourRankedKeywords.length > 0 ? `${data.yourRankedKeywords.length} ranked kws` : "View Rankings"}
              </button>
            </div>
          )}

          {/* Monthly Traffic Chart */}
          {chartData.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 mb-5">
              <div className="text-[10px] uppercase tracking-[0.16em] font-black text-slate-400 mb-1">Monthly Traffic</div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 6" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompact(v as number)} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }}
                    formatter={(value, name) => [formatCompact(value as number), name]}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  {allDomains.map((d, i) => (
                    (d === domain || activeCompetitors.has(d)) && (
                      <Line
                        key={d}
                        type="monotone"
                        dataKey={d}
                        name={d}
                        stroke={COLORS[i % COLORS.length]}
                        strokeWidth={d === domain ? 3 : 2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    )
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Competitor Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden mb-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-black uppercase tracking-wider text-slate-500">Competitor Domain</th>
                    <th className="px-5 py-3.5 text-center text-xs font-black uppercase tracking-wider text-slate-500">
                      Common Keywords
                      <span className="ml-1 text-[9px] text-slate-300 normal-case">(shared rankings)</span>
                    </th>
                    <th className="px-5 py-3.5 text-center text-xs font-black uppercase tracking-wider text-slate-500">
                      Keywords Gap
                      <span className="ml-1 text-[9px] text-slate-300 normal-case">(they rank, you don&apos;t)</span>
                    </th>
                    <th className="px-5 py-3.5 text-center text-xs font-black uppercase tracking-wider text-slate-500">
                      All Ranked
                      <span className="ml-1 text-[9px] text-slate-300 normal-case">(individual kws)</span>
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-black uppercase tracking-wider text-slate-500">
                      Estimated
                      <br />Traffic
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-black uppercase tracking-wider text-slate-500">Backlinks</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                        {data.competitors.length === 0
                          ? "No competitor data found. Try entering competitor domains manually."
                          : "Toggle competitors above to show data."}
                      </td>
                    </tr>
                  ) : activeRows.map((row, i) => {
                    const color = COLORS[(data.competitors.indexOf(row) + 1) % COLORS.length];
                    return (
                      <tr key={row.domain} className={`border-b border-slate-100 hover:bg-slate-50 ${i % 2 === 1 ? "bg-slate-50/30" : ""}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`https://www.google.com/s2/favicons?domain=${row.domain}&sz=16`} alt="" width={16} height={16} className="rounded-sm" />
                            <span className="font-semibold text-slate-800">{row.domain}</span>
                            {row.domainRank > 0 && (
                              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${row.domainRank >= 60 ? "bg-emerald-100 text-emerald-700" : row.domainRank >= 30 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                                DA {row.domainRank}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-lg font-black tabular-nums text-slate-900">{formatCompact(row.commonKeywordsCount)}</span>
                            {row.commonKeywords.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setModalState({ type: "common", row })}
                                className="rounded border border-[#f15b27] text-[#f15b27] text-[11px] font-semibold px-2 py-0.5 hover:bg-[#fff3ee] transition-colors"
                              >
                                View All ∨
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-lg font-black tabular-nums text-slate-900">{formatCompact(row.keywordGapCount)}</span>
                            {row.keywordGap.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setModalState({ type: "gap", row })}
                                className="rounded border border-[#f15b27] text-[#f15b27] text-[11px] font-semibold px-2 py-0.5 hover:bg-[#fff3ee] transition-colors"
                              >
                                View All ∨
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => setModalState({ type: "ranked", row })}
                            className="rounded border border-slate-300 text-slate-600 text-[11px] font-semibold px-2 py-0.5 hover:border-[#f15b27] hover:text-[#f15b27] transition-colors"
                          >
                            {formatCompact(row.commonKeywordsCount + row.keywordGapCount)} kws ↗
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums font-semibold text-slate-800">
                          {formatCompact(row.estimatedTraffic)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex flex-col items-end">
                            <span className="tabular-nums font-semibold text-slate-800">{formatCompact(row.backlinks)}</span>
                            {row.referringDomains > 0 && (
                              <span className="text-[10px] text-slate-400 tabular-nums">{formatCompact(row.referringDomains)} domains</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Export button */}
            <div className="flex justify-end px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={() => data && downloadCSV(domain, activeRows)}
                className="rounded-lg bg-[#f15b27] px-6 py-2 text-xs font-black text-white hover:bg-[#d94e1f] uppercase tracking-wider"
              >
                Export to CSV
              </button>
            </div>
          </div>

          {/* Suggested competitors if not shown */}
          {data.suggestedCompetitors.length > 0 && data.competitors.length < 3 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5">
              <div className="text-[10px] uppercase tracking-[0.14em] font-black text-slate-400 mb-3">More Suggested Competitors</div>
              <div className="flex flex-wrap gap-2">
                {data.suggestedCompetitors.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => void runAnalysis(undefined, [...competitorInputs.filter(Boolean), d])}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#f15b27] hover:text-[#f15b27] transition-colors"
                  >
                    + {d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Keyword modal */}
      {modalState.type && modalState.row && (
        <KwModal
          type={modalState.type}
          competitor={modalState.row.domain}
          rows={modalRows}
          rankedRows={modalRankedRows}
          onClose={() => setModalState({ type: null, row: null })}
        />
      )}

      {yourKwOpen && data && (
        <KwModal
          type="yours"
          competitor={domain}
          rows={[]}
          rankedRows={data.yourRankedKeywords}
          onClose={() => setYourKwOpen(false)}
        />
      )}
    </div>
  );
}
