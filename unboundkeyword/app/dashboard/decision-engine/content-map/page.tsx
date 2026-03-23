"use client";

import { useState } from "react";
import type { ContentMapResult } from "@/app/api/decision-engine/content-map/route";

type Phase = ContentMapResult["executionPlan"][number];
type Cluster = ContentMapResult["clusters"][number];
type TopKw = ContentMapResult["topOpportunities"][number];

const PRIORITY_COLOR = {
  High: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-slate-100 text-slate-500 border-slate-200",
};

const INTENT_COLOR: Record<string, string> = {
  pillar: "bg-violet-100 text-violet-700",
  supporting: "bg-sky-100 text-sky-700",
  commercial: "bg-green-100 text-green-700",
  comparison: "bg-orange-100 text-orange-700",
  faq: "bg-pink-100 text-pink-700",
};

export default function ContentMapPage() {
  const [keywords, setKeywords] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContentMapResult | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "clusters" | "plan" | "table">("summary");
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);

  // Load from list
  const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
  const [listsOpen, setListsOpen] = useState(false);
  const [listsLoading, setListsLoading] = useState(false);

  async function openListPicker() {
    setListsOpen(true);
    if (lists.length > 0) return;
    setListsLoading(true);
    try {
      const res = await fetch("/api/lists");
      const data = await res.json() as { lists?: { id: string; name: string }[] };
      setLists(data.lists ?? []);
    } finally {
      setListsLoading(false);
    }
  }

  async function loadList(listId: string) {
    setListsOpen(false);
    try {
      const res = await fetch(`/api/lists/${listId}/keywords`);
      const data = await res.json() as { keywords?: { keyword: string }[] };
      const kws = (data.keywords ?? []).map((k) => k.keyword).slice(0, 30);
      setKeywords(kws.join("\n"));
    } catch {
      // ignore
    }
  }

  async function runAnalysis() {
    const kwList = keywords
      .split(/[\n,]+/)
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 30);

    if (kwList.length === 0) {
      setError("Enter at least one keyword.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/decision-engine/content-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: kwList, domain: domain.trim() || undefined }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(j.error ?? `Error ${res.status}`);
      }
      const data = (await res.json()) as ContentMapResult;
      setResult(data);
      setActiveTab("summary");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.18em] text-[#f15b27] font-black mb-1">Decision Engine</div>
        <h1 className="text-3xl font-black text-slate-900">AI Content Map</h1>
        <p className="text-sm text-slate-500 mt-1">
          Enter up to 30 keywords. The engine scores each, clusters them by theme, and builds a prioritised content plan with execution phases.
        </p>
      </div>

      {/* Input Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-6">
        <div className="grid gap-4 md:grid-cols-[1fr_280px]">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Keywords <span className="text-slate-400 normal-case font-normal">(one per line or comma-separated, max 30)</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => void openListPicker()}
                  className="text-xs font-semibold text-[#f15b27] border border-[#f15b27]/30 rounded-lg px-2.5 py-1 hover:bg-[#f15b27]/5 transition"
                >
                  Load from list ↓
                </button>
                {listsOpen && (
                  <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-slate-200 rounded-xl shadow-lg min-w-[200px] py-1">
                    {listsLoading ? (
                      <div className="px-4 py-3 text-sm text-slate-400">Loading…</div>
                    ) : lists.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-slate-400">No saved lists</div>
                    ) : (
                      lists.map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => void loadList(l.id)}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                        >
                          {l.name}
                        </button>
                      ))
                    )}
                    <button
                      type="button"
                      onClick={() => setListsOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs text-slate-400 hover:bg-slate-50 border-t border-slate-100 transition"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
            <textarea
              className="w-full h-36 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#f15b27]/30 focus:border-[#f15b27]"
              placeholder={"seo services\nlocal seo for dentists\nbest seo agency near me\nhow to improve google ranking"}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Domain (optional)</label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f15b27]/30 focus:border-[#f15b27]"
                placeholder="yourdomain.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="mt-auto w-full rounded-xl bg-[#f15b27] text-white text-sm font-black py-3 hover:bg-[#d94e20] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                  Analysing…
                </span>
              ) : "Run AI Decision Report →"}
            </button>
            {loading && (
              <p className="text-xs text-slate-400 text-center">
                Running full decision-engine bundle on each keyword. This may take 15–60 seconds.
              </p>
            )}
          </div>
        </div>
        {error && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</div>
        )}
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Tab bar */}
          <div className="flex gap-1 mb-4 border-b border-slate-200">
            {(["summary", "clusters", "plan", "table"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-bold capitalize transition border-b-2 -mb-px ${activeTab === tab ? "border-[#f15b27] text-[#f15b27]" : "border-transparent text-slate-500 hover:text-slate-800"}`}
              >
                {tab === "summary" ? "Executive Summary" : tab === "plan" ? "Execution Plan" : tab === "table" ? "All Keywords" : "Content Clusters"}
              </button>
            ))}
          </div>

          {/* Summary tab */}
          {activeTab === "summary" && (
            <div className="space-y-4">
              {/* Summary card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Analysis Summary</div>
                <p className="text-sm leading-6 text-slate-700">{result.executiveSummary}</p>
                <div className="mt-4 flex flex-wrap gap-4">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-slate-900">{result.totalKeywords}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">Keywords Analysed</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-slate-900">{result.clusters.length}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">Content Clusters</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-emerald-600">{result.topOpportunities.filter((k) => k.priority === "High").length}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">High Priority</span>
                  </div>
                  {result.quickWins.length > 0 && (
                    <div className="flex flex-col">
                      <span className="text-2xl font-black text-[#f15b27]">{result.quickWins.length}</span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400">Quick Wins</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick wins */}
              {result.quickWins.length > 0 && (
                <div className="rounded-2xl border border-[#f15b27]/20 bg-[#fff8f5] p-5">
                  <div className="text-xs uppercase tracking-wider text-[#f15b27] font-black mb-3">Quick Win Keywords (Rank within 30 days)</div>
                  <ul className="space-y-1.5">
                    {result.quickWins.map((kw) => (
                      <li key={kw} className="flex items-center gap-2 text-sm text-slate-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#f15b27] shrink-0" />
                        {kw}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Top opportunities */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Top 10 Opportunities</div>
                <div className="space-y-2">
                  {result.topOpportunities.map((kw) => (
                    <div key={kw.keyword} className="flex items-center gap-3">
                      <div className="w-32 shrink-0">
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-[#f15b27] rounded-full" style={{ width: `${kw.opportunityScore}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-8">{kw.opportunityScore}</span>
                      <span className="text-sm text-slate-700 flex-1 truncate">{kw.keyword}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${PRIORITY_COLOR[kw.priority]}`}>{kw.priority}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${INTENT_COLOR[kw.intent] ?? "bg-slate-100 text-slate-500"}`}>{kw.intent}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Clusters tab */}
          {activeTab === "clusters" && (
            <div className="space-y-3">
              {result.clusters.map((cluster: Cluster) => (
                <div key={cluster.theme} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition"
                    onClick={() => setExpandedCluster(expandedCluster === cluster.theme ? null : cluster.theme)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${PRIORITY_COLOR[cluster.priority]}`}>{cluster.priority}</span>
                      <span className="font-black text-slate-900 capitalize">{cluster.theme}</span>
                      <span className="text-xs text-slate-400">{cluster.keywords.length} keywords · Score {cluster.totalOpportunityScore}</span>
                    </div>
                    <svg className={`h-4 w-4 text-slate-400 transition-transform ${expandedCluster === cluster.theme ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                  </button>
                  {expandedCluster === cluster.theme && (
                    <div className="px-5 pb-5 border-t border-slate-100">
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Pillar Page</div>
                          <p className="text-sm font-bold text-slate-800">{cluster.pillarTitle}</p>
                          <p className="text-xs text-slate-500 mt-1">Seed: {cluster.pillarKeyword}</p>
                        </div>
                        {cluster.supportingPageTitles.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Supporting Pages</div>
                            <ul className="space-y-1">
                              {cluster.supportingPageTitles.slice(0, 6).map((t, i) => (
                                <li key={i} className="text-sm text-slate-600 flex gap-1.5 items-start">
                                  <span className="text-slate-300 shrink-0">↳</span> {t}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      {cluster.internalLinkMap.length > 0 && (
                        <div className="mt-4">
                          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Internal Link Map</div>
                          <div className="space-y-1">
                            {cluster.internalLinkMap.slice(0, 5).map((link, i) => (
                              <div key={i} className="text-xs text-slate-600 flex gap-1.5 items-start">
                                <span className="text-slate-400 shrink-0">Link:</span>
                                <span className="text-sky-700 truncate">{link.from}</span>
                                <span className="text-slate-400 shrink-0">→</span>
                                <span className="text-violet-700 truncate">{link.to}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <table className="mt-4 w-full text-xs border-t border-slate-100">
                        <thead>
                          <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400">
                            <th className="py-2 pr-4">Keyword</th>
                            <th className="py-2 pr-4">Score</th>
                            <th className="py-2 pr-4">Priority</th>
                            <th className="py-2">Intent</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cluster.keywords.map((k) => (
                            <tr key={k.keyword} className="border-t border-slate-50">
                              <td className="py-1.5 pr-4 text-slate-700">{k.keyword}</td>
                              <td className="py-1.5 pr-4 font-bold text-slate-800">{k.opportunityScore}</td>
                              <td className="py-1.5 pr-4">
                                <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${PRIORITY_COLOR[k.priority]}`}>{k.priority}</span>
                              </td>
                              <td className="py-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${INTENT_COLOR[k.intent] ?? "bg-slate-100 text-slate-500"}`}>{k.intent}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Execution plan tab */}
          {activeTab === "plan" && (
            <div className="space-y-4">
              {result.executionPlan.map((phase: Phase) => (
                <div key={phase.phase} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-full bg-[#f15b27] text-white font-black text-sm flex items-center justify-center shrink-0">{phase.phase}</div>
                    <div>
                      <div className="font-black text-slate-900">{phase.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{phase.rationale}</div>
                    </div>
                  </div>
                  {phase.keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {phase.keywords.map((kw) => (
                        <span key={kw} className="bg-slate-100 text-slate-700 text-xs rounded-lg px-2.5 py-1 font-medium">{kw}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic mt-2">No keywords matched this phase criteria for the submitted batch.</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* All keywords table */}
          {activeTab === "table" && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-3">Keyword</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Intent</th>
                      <th className="px-4 py-3">Est. Traffic</th>
                      <th className="px-4 py-3">Monetization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...result.topOpportunities, ...result.clusters.flatMap((c) => c.keywords).filter((k) => !result.topOpportunities.find((t) => t.keyword === k.keyword))]
                      .sort((a, b) => b.opportunityScore - a.opportunityScore)
                      .map((kw) => (
                        <tr key={kw.keyword} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-medium text-slate-800">{kw.keyword}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full bg-[#f15b27] rounded-full" style={{ width: `${kw.opportunityScore}%` }} />
                              </div>
                              <span className="text-xs font-bold text-slate-700">{kw.opportunityScore}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${PRIORITY_COLOR[kw.priority]}`}>{kw.priority}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${INTENT_COLOR[kw.intent] ?? "bg-slate-100 text-slate-500"}`}>{kw.intent}</span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">{kw.estimatedTraffic.toLocaleString()}</td>
                          <td className="px-4 py-2.5">
                            <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${kw.monetizationPotential}%` }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
