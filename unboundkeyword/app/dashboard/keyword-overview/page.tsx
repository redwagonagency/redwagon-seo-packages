"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type {
  SerpOrganicResult,
  AutocompleteLetterGroup,
  AiKeywordVolumeItem,
  LighthouseLiveResult,
  LlmMentionLiveItem,
  PeopleAlsoAskItem,
} from "@/lib/dataforseo/client";
import type { CitationItem, PhraseTrendItem, PaidSearchData, DemographicsData, RelatedKwItem } from "@/app/api/keyword-overview/route";

interface OverviewData {
  keyword: string;
  domain: string | null;
  serp: SerpOrganicResult[];
  paa: PeopleAlsoAskItem[];
  autocomplete: AutocompleteLetterGroup[];
  citations: CitationItem[];
  phraseTrends: PhraseTrendItem[];
  aiVolume: AiKeywordVolumeItem[];
  llmMentions: LlmMentionLiveItem[];
  lighthouse: LighthouseLiveResult | null;
  paid: PaidSearchData | null;
  demographics: DemographicsData | null;
  relatedKeywords?: RelatedKwItem[];
  keywordDifficulty?: number | null;
  errors: Record<string, string>;
}

type IdeasTab = "related" | "paa" | "autocomplete" | "citations" | "ai" | "llm";

function ScoreDial({ label, value }: { label: string; value: number | null }) {
  const pct = value !== null ? Math.round(value * 100) : null;
  const color =
    pct === null ? "#94a3b8" : pct >= 90 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full border-4 text-lg font-black"
        style={{ borderColor: color, color }}
      >
        {pct !== null ? pct : "—"}
      </div>
      <span className="text-xs text-slate-500 text-center leading-tight">{label}</span>
    </div>
  );
}

function PaaRow({ item }: { item: PeopleAlsoAskItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-white hover:bg-slate-50 transition-colors"
      >
        <span className="font-medium text-slate-800 text-sm">{item.question}</span>
        <svg
          className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-slate-100">
          {item.answer && (
            <p className="text-sm text-slate-700 mb-2 leading-relaxed">{item.answer}</p>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#f15b27] hover:underline"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=12`}
                alt=""
                width={12}
                height={12}
                className="rounded-sm"
              />
              {item.domain || item.url}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// SVG area trend chart
function TrendChart({ items }: { items: PhraseTrendItem[] }) {
  if (items.length < 2) return null;
  const W = 600, H = 160, PAD = 20;
  const vals = items.map((i) => i.impressions);
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals);
  const range = max - min || 1;
  const pts = items.map((item, i) => {
    const x = PAD + (i / (items.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((item.impressions - min) / range) * (H - PAD * 2);
    return [x, y] as [number, number];
  });
  const linePath = `M ${pts.map(([x, y]) => `${x},${y}`).join(" L ")}`;
  const areaPath = `M ${PAD},${H - PAD} L ${pts.map(([x, y]) => `${x},${y}`).join(" L ")} L ${W - PAD},${H - PAD} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
      <defs>
        <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f15b27" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#f15b27" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#tg)" />
      <path d={linePath} fill="none" stroke="#f15b27" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts
        .filter((_, i) => i === 0 || i === pts.length - 1 || i % Math.max(1, Math.floor(items.length / 6)) === 0)
        .map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.5" fill="white" stroke="#f15b27" strokeWidth="2" />
        ))}
      <text x={PAD} y={H - 4} fontSize="9" fill="#94a3b8">{items[0].date?.slice(0, 7)}</text>
      <text x={W - PAD} y={H - 4} fontSize="9" fill="#94a3b8" textAnchor="end">{items[items.length - 1].date?.slice(0, 7)}</text>
    </svg>
  );
}

export default function KeywordOverviewPage() {
  const [keyword, setKeyword] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState("");
  const [ideasTab, setIdeasTab] = useState<IdeasTab>("related");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch("/api/keyword-overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), domain: domain.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");
      setData(json as OverviewData);
      setIdeasTab("related");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function getClickShare(d: OverviewData) {
    const comp = d.paid?.competition ?? 0;
    const paid = Math.round(comp * 24);
    const organic = Math.min(Math.round((1 - comp * 0.4) * 60), 100 - paid);
    const noClick = Math.max(100 - organic - paid, 0);
    return { organic, paid, noClick };
  }

  const IDEAS_TABS: { id: IdeasTab; label: string; count: number }[] = data
    ? [
        { id: "related", label: "Suggestions", count: data.relatedKeywords?.length ?? 0 },
        { id: "paa", label: "Questions", count: data.paa?.length ?? 0 },
        { id: "autocomplete", label: "A–Z", count: data.autocomplete.filter((g) => g.suggestions.length > 0).length },
        { id: "citations", label: "Top Content", count: data.citations.length },
        { id: "ai", label: "AI Search", count: data.aiVolume.length },
        { id: "llm", label: "LLM Mentions", count: data.llmMentions.length },
      ]
    : [];

  return (
    <div className="p-6 max-w-7xl">
      {/* Search form */}
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 mb-6">
        <div className="text-xs uppercase tracking-[0.16em] text-[#f15b27] font-black mb-0.5">Keyword Overview</div>
        <h1 className="text-2xl font-black text-slate-900 mb-4">Single Keyword Deep Dive</h1>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter a keyword…"
              className="flex-1 text-base"
              required
            />
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Your domain for Lighthouse (optional)"
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !keyword.trim()}>
              {loading ? "Analyzing…" : "Analyze"}
            </Button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {data && Object.keys(data.errors).length > 0 && (
            <p className="mt-2 text-xs text-amber-600">
              Partial results — some sections failed: {Object.keys(data.errors).join(", ")}
            </p>
          )}
        </form>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 flex items-center justify-center gap-3 text-slate-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Fetching live data across 10+ sources…
        </div>
      )}

      {/* ═══ RESULTS ═══ */}
      {data && !loading && (
        <div className="space-y-5">

          {/* ── 1. HERO STAT BOXES ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                label: "Monthly Volume",
                value: data.paid?.searchVolume != null ? data.paid.searchVolume.toLocaleString() : "—",
                sub: null,
                color: "text-slate-900",
              },
              {
                label: "CPC",
                value: data.paid?.cpc != null ? `$${data.paid.cpc.toFixed(2)}` : "—",
                sub: null,
                color: "text-slate-900",
              },
              {
                label: "SEO Difficulty",
                value: data.keywordDifficulty != null ? String(data.keywordDifficulty) : "—",
                sub: data.keywordDifficulty != null
                  ? (data.keywordDifficulty >= 70 ? "Hard" : data.keywordDifficulty >= 40 ? "Medium" : "Easy")
                  : null,
                color: data.keywordDifficulty != null
                  ? (data.keywordDifficulty >= 70 ? "text-red-600" : data.keywordDifficulty >= 40 ? "text-amber-500" : "text-emerald-600")
                  : "text-slate-900",
              },
              {
                label: "Paid Competition",
                value: data.paid?.competition != null ? `${Math.round(data.paid.competition * 100)}%` : "—",
                sub: data.paid?.competitionLevel ?? null,
                color: data.paid?.competitionLevel === "HIGH" ? "text-red-600" : data.paid?.competitionLevel === "MEDIUM" ? "text-amber-500" : "text-slate-900",
              },
              {
                label: "SERP Positions",
                value: String(data.serp.length),
                sub: "indexed pages",
                color: "text-slate-900",
              },
              {
                label: "Related KWs",
                value: String(data.relatedKeywords?.length ?? "—"),
                sub: "discovered",
                color: "text-slate-900",
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                <div className="text-[10px] uppercase tracking-[0.14em] font-black text-slate-400 mb-1">{stat.label}</div>
                <div className={`text-3xl font-black tabular-nums leading-none ${stat.color}`}>{stat.value}</div>
                {stat.sub && <div className="text-xs font-semibold text-slate-400 mt-0.5">{stat.sub}</div>}
              </div>
            ))}
          </div>

          {/* ── 2. VOLUME CHART + DEMOGRAPHICS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
            {/* Left: trend chart */}
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5">
              <div className="text-[10px] uppercase tracking-[0.14em] font-black text-slate-400 mb-0.5">Volume Trend</div>
              <div className="text-sm font-semibold text-slate-700 mb-3">
                {data.paid?.searchVolume != null
                  ? `${data.paid.searchVolume.toLocaleString()} monthly searches`
                  : "Search trend"}{" "}
                for &ldquo;{data.keyword}&rdquo;
              </div>
              {data.phraseTrends.length >= 2 ? (
                <TrendChart items={data.phraseTrends} />
              ) : (
                <div className="h-32 flex items-center justify-center text-slate-400 text-sm rounded-xl bg-slate-50">
                  No trend data available
                </div>
              )}
            </div>

            {/* Right: click share + demographics stacked */}
            <div className="flex flex-col gap-4">
              {/* Click Distribution */}
              {data.paid && (() => {
                const { organic, paid: paidShare, noClick } = getClickShare(data);
                return (
                  <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                    <div className="text-[10px] uppercase tracking-[0.14em] font-black text-slate-400 mb-1">Click Distribution</div>
                    <div className="text-xl font-black text-slate-900 mb-3">
                      ~{organic}% click organic results
                    </div>
                    <div className="flex h-4 rounded-full overflow-hidden gap-px mb-2.5">
                      <div className="bg-emerald-500" style={{ width: `${organic}%` }} title={`Organic ${organic}%`} />
                      <div className="bg-[#f15b27]" style={{ width: `${paidShare}%` }} title={`Paid ${paidShare}%`} />
                      <div className="bg-slate-200" style={{ width: `${noClick}%` }} title={`No-click ${noClick}%`} />
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />SEO {organic}%</span>
                      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#f15b27] inline-block" />Paid {paidShare}%</span>
                      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-300 inline-block" />No clicks {noClick}%</span>
                    </div>
                  </div>
                );
              })()}

              {/* Demographics */}
              {data.demographics && (data.demographics.male !== null || data.demographics.ageGroups.length > 0) && (
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 flex-1">
                  <div className="text-[10px] uppercase tracking-[0.14em] font-black text-slate-400 mb-3">Searcher Demographics</div>
                  {data.demographics.male !== null && data.demographics.female !== null && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-slate-500 mb-1">Gender</div>
                      <div className="flex rounded-full overflow-hidden h-4">
                        <div className="bg-blue-400 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${data.demographics.male}%` }}>
                          {data.demographics.male >= 20 ? `${data.demographics.male}%` : ""}
                        </div>
                        <div className="bg-pink-400 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${data.demographics.female}%` }}>
                          {data.demographics.female >= 20 ? `${data.demographics.female}%` : ""}
                        </div>
                      </div>
                      <div className="flex justify-between mt-1 text-[10px]">
                        <span className="text-blue-500 font-semibold">♂ {data.demographics.male}%</span>
                        <span className="text-pink-500 font-semibold">♀ {data.demographics.female}%</span>
                      </div>
                    </div>
                  )}
                  {data.demographics.ageGroups.length > 0 && (() => {
                    const maxIdx = Math.max(...data.demographics!.ageGroups.map((a) => a.index), 1);
                    return (
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-2">Age Range</div>
                        <div className="space-y-1.5">
                          {data.demographics!.ageGroups.map((ag) => (
                            <div key={ag.label} className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-500 w-12 shrink-0">{ag.label}</span>
                              <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-3 rounded-full bg-[#f15b27] opacity-80"
                                  style={{ width: `${Math.round((ag.index / maxIdx) * 100)}%` }}
                                />
                              </div>
                              <span className="text-[11px] tabular-nums text-slate-400 w-8 text-right">{ag.index}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* ── 3. KEYWORD IDEAS ── */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-6 pt-5 border-b border-slate-100">
              <div className="text-[10px] uppercase tracking-[0.14em] font-black text-[#f15b27]">Keyword Ideas</div>
              <h2 className="text-lg font-black text-slate-900 mb-3">for &ldquo;{data.keyword}&rdquo;</h2>
              <div className="flex gap-0 -mb-px overflow-x-auto">
                {IDEAS_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setIdeasTab(tab.id)}
                    className={`px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                      ideasTab === tab.id
                        ? "border-[#f15b27] text-[#f15b27]"
                        : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                    <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{tab.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {/* Suggestions = Related Keywords */}
              {ideasTab === "related" && (
                !data.relatedKeywords?.length ? (
                  <p className="text-slate-500 text-sm">No related keyword data available.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          <th className="pb-2 pr-3 text-left">Keyword</th>
                          <th className="pb-2 pr-3 text-right w-28">Volume</th>
                          <th className="pb-2 pr-3 text-right w-24">CPC</th>
                          <th className="pb-2 pr-3 text-right w-28">Competition</th>
                          <th className="pb-2 text-right w-24">Difficulty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.relatedKeywords.map((r) => (
                          <tr
                            key={r.keyword}
                            className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                            onClick={() => setKeyword(r.keyword)}
                          >
                            <td className="py-2.5 pr-3 font-medium text-slate-800 hover:text-[#f15b27]">{r.keyword}</td>
                            <td className="py-2.5 pr-3 text-right tabular-nums text-slate-600">{r.volume > 0 ? r.volume.toLocaleString() : "—"}</td>
                            <td className="py-2.5 pr-3 text-right tabular-nums text-slate-600">{r.cpc != null ? `$${r.cpc.toFixed(2)}` : "—"}</td>
                            <td className="py-2.5 pr-3 text-right tabular-nums text-slate-600">{r.competition != null ? `${Math.round(r.competition * 100)}%` : "—"}</td>
                            <td className="py-2.5 text-right">
                              {r.difficulty != null ? (
                                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${r.difficulty >= 70 ? "bg-red-100 text-red-700" : r.difficulty >= 40 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                  {r.difficulty}
                                </span>
                              ) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* Questions = PAA */}
              {ideasTab === "paa" && (
                !data.paa?.length ? (
                  <p className="text-slate-500 text-sm">No question data available.</p>
                ) : (
                  <div className="space-y-2">
                    {data.paa.map((item, i) => <PaaRow key={i} item={item} />)}
                  </div>
                )
              )}

              {/* A–Z Autocomplete */}
              {ideasTab === "autocomplete" && (
                data.autocomplete.every((g) => g.suggestions.length === 0) ? (
                  <p className="text-slate-500 text-sm">No autocomplete suggestions found.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {data.autocomplete.filter((g) => g.suggestions.length > 0).map((group) => (
                      <div key={group.letter} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <div className="text-xs font-black uppercase text-[#f15b27] mb-2">{group.letter.toUpperCase()}</div>
                        <ul className="space-y-1">
                          {group.suggestions.map((s) => (
                            <li key={s}>
                              <button type="button" onClick={() => setKeyword(s)} className="text-xs text-slate-700 hover:text-[#f15b27] text-left w-full truncate">
                                {s}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Top Content = Citations */}
              {ideasTab === "citations" && (
                data.citations.length === 0 ? (
                  <p className="text-slate-500 text-sm">No citation data available.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {data.citations.map((c, i) => (
                      <li key={i} className="py-3 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 text-sm leading-snug">{c.title || c.domain || "Untitled"}</div>
                          {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#f15b27] hover:underline truncate block">{c.url}</a>}
                          {c.snippet && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{c.snippet}</p>}
                        </div>
                        <div className="text-xs text-slate-400 whitespace-nowrap shrink-0">{c.contentDate ? c.contentDate.slice(0, 10) : null}</div>
                      </li>
                    ))}
                  </ul>
                )
              )}

              {/* AI Search Volume */}
              {ideasTab === "ai" && (
                data.aiVolume.length === 0 ? (
                  <p className="text-slate-500 text-sm">No AI volume data available.</p>
                ) : (
                  <div className="space-y-6">
                    {data.aiVolume.map((item) => (
                      <div key={item.keyword}>
                        <div className="flex items-baseline gap-3 mb-3">
                          <div className="text-5xl font-black text-slate-900">{item.searchVolume !== null ? item.searchVolume.toLocaleString() : "—"}</div>
                          <div className="text-sm text-slate-500">AI searches / mo</div>
                        </div>
                        {item.breakdown.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {item.breakdown.map((b) => (
                              <div key={b.model} className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm">
                                <span className="font-semibold text-slate-700">{b.model}</span>
                                <span className="ml-2 text-slate-500">{b.volume.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* LLM Mentions */}
              {ideasTab === "llm" && (
                data.llmMentions.length === 0 ? (
                  <p className="text-slate-500 text-sm">No LLM mention data.{!data.domain && " Enter a domain above to check if it's mentioned."}</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {data.llmMentions.map((m, i) => (
                      <li key={i} className="py-3 flex items-start gap-3">
                        <span className={`mt-0.5 flex-shrink-0 h-4 w-4 rounded-full ${m.mentioned ? "bg-green-500" : "bg-slate-200"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{m.llm}</span>
                            {m.mentioned && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">Mentioned</span>}
                          </div>
                          <div className="font-semibold text-slate-900 text-sm mt-0.5">{m.title || m.query}</div>
                          {m.url && <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#f15b27] hover:underline truncate block">{m.url}</a>}
                          {m.snippet && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{m.snippet}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </div>

          {/* ── 4. TOP ORGANIC RESULTS ── */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] font-black text-[#f15b27]">SERP Analysis</div>
                <h2 className="text-lg font-black text-slate-900">Top Results for &ldquo;{data.keyword}&rdquo;</h2>
              </div>
              <span className="text-sm text-slate-400">{data.serp.length} results</span>
            </div>
            {data.serp.length === 0 ? (
              <p className="p-6 text-slate-500 text-sm">No SERP data available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <th className="px-6 pb-2 pt-3 text-left w-10">#</th>
                      <th className="pb-2 pt-3 pr-4 text-left">Domain</th>
                      <th className="pb-2 pt-3 pr-6 text-left">Title &amp; URL</th>
                      <th className="pb-2 pt-3 pr-6 text-right w-20">ETV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.serp.map((r) => (
                      <tr key={r.url} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-6 py-3 font-mono text-slate-400 text-xs">{r.position}</td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`https://www.google.com/s2/favicons?domain=${r.domain}&sz=16`} alt="" width={16} height={16} className="rounded-sm shrink-0" />
                            <span className="font-medium text-slate-700 whitespace-nowrap">{r.domain}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-6">
                          <div className="font-semibold text-slate-900 leading-snug">{r.title}</div>
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#f15b27] hover:underline truncate block max-w-lg">{r.url}</a>
                          {r.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{r.description}</p>}
                        </td>
                        <td className="py-3 pr-6 text-right font-mono text-slate-600 text-xs">{r.etv !== null ? r.etv.toLocaleString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── 5. LIGHTHOUSE (if domain provided) ── */}
          {data.domain && (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5">
              <div className="text-[10px] uppercase tracking-[0.14em] font-black text-[#f15b27] mb-0.5">Lighthouse Audit</div>
              <h2 className="text-lg font-black text-slate-900 mb-4">{data.domain}</h2>
              {!data.lighthouse ? (
                <p className="text-slate-500 text-sm">
                  Lighthouse data unavailable.
                  {data.errors.lighthouse && <span className="ml-1 text-red-500">{data.errors.lighthouse}</span>}
                </p>
              ) : (
                <div>
                  <div className="flex flex-wrap gap-8 mb-6">
                    <ScoreDial label="Performance" value={data.lighthouse.performance} />
                    <ScoreDial label="Accessibility" value={data.lighthouse.accessibility} />
                    <ScoreDial label="Best Practices" value={data.lighthouse.bestPractices} />
                    <ScoreDial label="SEO" value={data.lighthouse.seo} />
                  </div>
                  {data.lighthouse.failedAudits.length > 0 && (
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Issues to Fix</h3>
                      <ul className="space-y-2">
                        {data.lighthouse.failedAudits.map((a) => (
                          <li key={a.id} className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                            <span className={`flex-shrink-0 mt-0.5 text-xs font-bold px-1.5 py-0.5 rounded uppercase ${a.impact === "high" ? "bg-red-200 text-red-800" : a.impact === "medium" ? "bg-amber-200 text-amber-800" : "bg-slate-200 text-slate-600"}`}>
                              {a.impact}
                            </span>
                            <span className="text-sm text-slate-800">{a.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
