"use client";

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type {
  SerpOrganicResult,
  AutocompleteLetterGroup,
  AiKeywordVolumeItem,
  LighthouseLiveResult,
  LlmMentionLiveItem,
  PeopleAlsoAskItem,
  MonthlyVolumeItem,
} from "@/lib/dataforseo/client";
import type {
  CitationItem,
  PhraseTrendItem,
  PaidSearchData,
  DemographicsData,
  RelatedKwItem,
  ClickDistribution,
} from "@/app/api/keyword-overview/route";

// Re-export SerpFeaturesResult shape locally to avoid server import
interface SerpFeaturesResult {
  hasAiOverview: boolean;
  hasFeaturedSnippet: boolean;
  topAdCount: number;
  bottomAdCount: number;
  hasShopping: boolean;
  hasVideoCarousel: boolean;
  hasLocalPack: boolean;
  hasPeopleAlsoAsk: boolean;
}

interface OverviewData {
  keyword: string;
  domain: string | null;
  serp: SerpOrganicResult[];
  paa: PeopleAlsoAskItem[];
  autocomplete: AutocompleteLetterGroup[];
  citations: CitationItem[];
  phraseTrends: PhraseTrendItem[];
  monthlyVolumes: MonthlyVolumeItem[];
  aiVolume: AiKeywordVolumeItem[];
  llmMentions: LlmMentionLiveItem[];
  lighthouse: LighthouseLiveResult | null;
  paid: PaidSearchData | null;
  demographics: DemographicsData | null;
  relatedKeywords?: RelatedKwItem[];
  questions?: string[];
  prepositions?: string[];
  comparisons?: string[];
  keywordDifficulty?: number | null;
  serpFeatures?: SerpFeaturesResult | null;
  clickDistribution?: ClickDistribution;
  errors: Record<string, string>;
}

type IdeasTab = "suggestions" | "related" | "questions" | "prepositions" | "comparisons" | "citations" | "ai" | "llm";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ─── Score dial (lighthouse) ─────────────────────────────────────────────────
function ScoreDial({ label, value }: { label: string; value: number | null }) {
  const pct = value !== null ? Math.round(value * 100) : null;
  const color = pct === null ? "#94a3b8" : pct >= 90 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 text-lg font-black" style={{ borderColor: color, color }}>
        {pct !== null ? pct : "—"}
      </div>
      <span className="text-xs text-slate-500 text-center leading-tight">{label}</span>
    </div>
  );
}

// ─── People Also Ask accordion row ──────────────────────────────────────────
function PaaRow({ item }: { item: PeopleAlsoAskItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-4 py-3 text-left bg-white hover:bg-slate-50 transition-colors">
        <span className="font-medium text-slate-800 text-sm">{item.question}</span>
        <svg className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-slate-100">
          {item.answer && <p className="text-sm text-slate-700 mb-2 leading-relaxed">{item.answer}</p>}
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[#f15b27] hover:underline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=12`} alt="" width={12} height={12} className="rounded-sm" />
              {item.domain || item.url}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Keyword ideas table ─────────────────────────────────────────────────────
function KwTable({ rows, onSelect }: { rows: RelatedKwItem[]; onSelect?: (kw: string) => void }) {
  if (!rows.length) return <p className="text-slate-500 text-sm">No data available.</p>;
  return (
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
          {rows.map((r) => (
            <tr key={r.keyword} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={() => onSelect?.(r.keyword)}>
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
  );
}

// ─── Simple keyword list from autocomplete strings ───────────────────────────
function SimpleKwList({ keywords, onSelect }: { keywords: string[]; onSelect?: (kw: string) => void }) {
  if (!keywords.length) return <p className="text-slate-500 text-sm">No data available.</p>;
  return (
    <ul className="divide-y divide-slate-50">
      {keywords.map((kw) => (
        <li key={kw}>
          <button type="button" onClick={() => onSelect?.(kw)} className="w-full text-left py-2.5 px-1 text-sm text-slate-700 hover:text-[#f15b27] hover:bg-slate-50 transition-colors">
            {kw}
          </button>
        </li>
      ))}
    </ul>
  );
}

// ─── Difficulty badge ────────────────────────────────────────────────────────
function DiffBadge({ value, label }: { value: number | null | undefined; label: string }) {
  if (value == null) return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <div className="text-[10px] uppercase tracking-[0.14em] font-black text-slate-400 mb-1">{label}</div>
      <div className="text-3xl font-black text-slate-900">—</div>
    </div>
  );
  const color = value >= 70 ? "text-red-600" : value >= 40 ? "text-amber-500" : "text-emerald-600";
  const tag = value >= 70 ? "Hard" : value >= 40 ? "Medium" : "Easy";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <div className="text-[10px] uppercase tracking-[0.14em] font-black text-slate-400 mb-1">{label}</div>
      <div className={`text-3xl font-black tabular-nums leading-none ${color}`}>{value}</div>
      <div className={`text-xs font-semibold mt-0.5 ${color}`}>{tag}</div>
    </div>
  );
}

export default function KeywordOverviewPage() {
  const [keyword, setKeyword] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState("");
  const [ideasTab, setIdeasTab] = useState<IdeasTab>("suggestions");

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
      setIdeasTab("suggestions");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Build dual-line volume chart data (mobile ~60%, desktop ~40% of total)
  function buildVolumeChartData(d: OverviewData) {
    const src = d.monthlyVolumes?.length ? d.monthlyVolumes : [];
    if (!src.length && d.phraseTrends?.length) {
      // Fallback: use phrase trends impressions normalised to search volume scale
      const vol = d.paid?.searchVolume ?? 1000;
      const max = Math.max(...d.phraseTrends.map((t) => t.impressions), 1);
      return d.phraseTrends.slice(-12).map((t) => ({
        label: t.date.slice(0, 7),
        mobile: Math.round((t.impressions / max) * vol * 0.6),
        desktop: Math.round((t.impressions / max) * vol * 0.4),
      }));
    }
    return src.slice(-12).map((m) => ({
      label: `${MONTH_NAMES[m.month - 1]} ${m.year}`,
      mobile: Math.round(m.volume * 0.6),
      desktop: Math.round(m.volume * 0.4),
    }));
  }

  // Build click distribution chart data
  function buildClickChartData(d: OverviewData) {
    const cd = d.clickDistribution ?? { organic: 54, paid: 12, aiOverview: 0, featuredSnippet: 0, noClick: 34 };
    const items = [
      { name: "Organic SEO", value: cd.organic, color: "#22c55e" },
      { name: "Paid Ads", value: cd.paid, color: "#f15b27" },
      { name: "AI Overview", value: cd.aiOverview, color: "#6366f1" },
      { name: "Featured Snippet", value: cd.featuredSnippet, color: "#0ea5e9" },
      { name: "No Click", value: cd.noClick, color: "#e2e8f0" },
    ];
    return items.filter((i) => i.value > 0);
  }

  const IDEAS_TABS: { id: IdeasTab; label: string; count: number }[] = data
    ? [
        { id: "suggestions", label: "Suggestions", count: data.relatedKeywords?.length ?? 0 },
        { id: "related", label: "Related", count: (data.relatedKeywords?.length ?? 0) },
        { id: "questions", label: "Questions", count: (data.questions?.length ?? 0) + (data.paa?.length ?? 0) },
        { id: "prepositions", label: "Prepositions", count: data.prepositions?.length ?? 0 },
        { id: "comparisons", label: "Comparisons", count: data.comparisons?.length ?? 0 },
        { id: "citations", label: "Top Content", count: data.citations.length },
        { id: "ai", label: "AI Search", count: data.aiVolume.length },
        { id: "llm", label: "LLM Mentions", count: data.llmMentions.length },
      ]
    : [];

  return (
    <div className="p-6 max-w-7xl">
      {/* ── Search Form ── */}
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 mb-6">
        <div className="text-xs uppercase tracking-[0.16em] text-[#f15b27] font-black mb-0.5">Keyword Overview</div>
        <h1 className="text-2xl font-black text-slate-900 mb-4">Single Keyword Deep Dive</h1>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Enter a keyword…" className="flex-1 text-base" required />
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Your domain for Lighthouse (optional)" className="flex-1" />
            <Button type="submit" disabled={loading || !keyword.trim()}>{loading ? "Analyzing…" : "Analyze"}</Button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {data && Object.keys(data.errors).length > 0 && (
            <p className="mt-2 text-xs text-amber-600">Partial results — some sections failed: {Object.keys(data.errors).join(", ")}</p>
          )}
        </form>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 flex items-center justify-center gap-3 text-slate-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Fetching live data across 10+ sources…
        </div>
      )}

      {/* ══════ RESULTS ══════ */}
      {data && !loading && (
        <div className="space-y-5">

          {/* ── 1. HERO STAT BOXES ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <div className="text-[10px] uppercase tracking-[0.14em] font-black text-slate-400 mb-1">Monthly Volume</div>
              <div className="text-3xl font-black tabular-nums text-slate-900">
                {data.paid?.searchVolume != null ? data.paid.searchVolume.toLocaleString() : "—"}
              </div>
              <div className="text-xs font-semibold text-slate-400 mt-0.5">avg monthly searches</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <div className="text-[10px] uppercase tracking-[0.14em] font-black text-slate-400 mb-1">CPC</div>
              <div className="text-3xl font-black tabular-nums text-slate-900">
                {data.paid?.cpc != null ? `$${data.paid.cpc.toFixed(2)}` : "—"}
              </div>
              <div className="text-xs font-semibold text-slate-400 mt-0.5">cost per click</div>
            </div>

            <DiffBadge value={data.keywordDifficulty} label="SEO Difficulty" />

            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <div className="text-[10px] uppercase tracking-[0.14em] font-black text-slate-400 mb-1">Paid Competition</div>
              <div className={`text-3xl font-black tabular-nums leading-none ${
                data.paid?.competitionLevel === "HIGH" ? "text-red-600" :
                data.paid?.competitionLevel === "MEDIUM" ? "text-amber-500" : "text-slate-900"
              }`}>
                {data.paid?.competition != null ? `${Math.round(data.paid.competition * 100)}%` : "—"}
              </div>
              {data.paid?.competitionLevel && (
                <div className={`text-xs font-semibold mt-0.5 ${
                  data.paid.competitionLevel === "HIGH" ? "text-red-500" :
                  data.paid.competitionLevel === "MEDIUM" ? "text-amber-500" : "text-emerald-600"
                }`}>{data.paid.competitionLevel}</div>
              )}
            </div>
          </div>

          {/* ── SERP feature badges ── */}
          {data.serpFeatures && (
            <div className="flex flex-wrap gap-2">
              {data.serpFeatures.hasAiOverview && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 text-indigo-700 px-3 py-1 text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> AI Overview
                </span>
              )}
              {data.serpFeatures.hasFeaturedSnippet && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 text-sky-700 px-3 py-1 text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" /> Featured Snippet
                </span>
              )}
              {data.serpFeatures.topAdCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-400" /> {data.serpFeatures.topAdCount} Top Ad{data.serpFeatures.topAdCount > 1 ? "s" : ""}
                </span>
              )}
              {data.serpFeatures.hasShopping && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Shopping
                </span>
              )}
              {data.serpFeatures.hasVideoCarousel && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Videos
                </span>
              )}
              {data.serpFeatures.hasLocalPack && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Local Pack
                </span>
              )}
              {data.serpFeatures.hasPeopleAlsoAsk && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400" /> People Also Ask
                </span>
              )}
            </div>
          )}

          {/* ── 2. VOLUME CHART ── */}
          {(() => {
            const chartData = buildVolumeChartData(data);
            if (!chartData.length) return null;
            const vol = data.paid?.searchVolume;
            return (
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5">
                <div className="text-[10px] uppercase tracking-[0.14em] font-black text-slate-400 mb-0.5">Search Volume Trend</div>
                <div className="flex items-baseline gap-3 mb-1">
                  <h2 className="text-lg font-black text-slate-900">
                    {vol != null ? vol.toLocaleString() : ""} monthly searches for &ldquo;{data.keyword}&rdquo;
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mb-4">Mobile vs. Desktop — estimated from monthly data</p>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gradMobile" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f15b27" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#f15b27" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gradDesktop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                      formatter={(value) => [typeof value === "number" ? value.toLocaleString() : value]}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                    <Area type="monotone" dataKey="mobile" name="Mobile" stroke="#f15b27" strokeWidth={2.5} fill="url(#gradMobile)" dot={false} activeDot={{ r: 4 }} />
                    <Area type="monotone" dataKey="desktop" name="Desktop" stroke="#f59e0b" strokeWidth={2.5} fill="url(#gradDesktop)" dot={false} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            );
          })()}

          {/* ── 3. CLICK DISTRIBUTION + DEMOGRAPHICS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">

            {/* Left: Click Distribution */}
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5">
              <div className="text-[10px] uppercase tracking-[0.14em] font-black text-slate-400 mb-0.5">Click Distribution</div>
              <div className="text-lg font-black text-slate-900 mb-1">
                Where do searchers click for &ldquo;{data.keyword}&rdquo;?
              </div>
              {data.paid?.searchVolume && (
                <p className="text-xs text-slate-500 mb-4">
                  Estimated from {data.paid.searchVolume.toLocaleString()} monthly searches
                  {data.serpFeatures?.hasAiOverview ? " · AI Overview detected" : ""}
                  {data.serpFeatures?.hasFeaturedSnippet ? " · Featured Snippet detected" : ""}
                </p>
              )}
              {(() => {
                const cd = buildClickChartData(data);
                if (!cd.length) return <p className="text-slate-400 text-sm">No data available.</p>;

                // Stacked horizontal bar
                const total = cd.reduce((s, i) => s + i.value, 0);
                return (
                  <div className="space-y-4">
                    {/* Visual bar */}
                    <div className="flex h-8 rounded-xl overflow-hidden gap-0.5">
                      {cd.map((seg) => (
                        <div
                          key={seg.name}
                          style={{ width: `${(seg.value / total) * 100}%`, backgroundColor: seg.color }}
                          title={`${seg.name}: ${seg.value}%`}
                          className="flex items-center justify-center text-white text-[10px] font-bold overflow-hidden"
                        >
                          {seg.value >= 12 ? `${seg.value}%` : ""}
                        </div>
                      ))}
                    </div>
                    {/* Legend with recharts for hover tooltips */}
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      {cd.map((seg) => (
                        <div key={seg.name} className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                          <span className="text-sm font-semibold text-slate-700">{seg.value}%</span>
                          <span className="text-xs text-slate-400">{seg.name}</span>
                        </div>
                      ))}
                    </div>
                    {/* Bar chart breakdown */}
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={cd} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
                        <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} width={110} />
                        <Tooltip formatter={(v) => [`${v}%`, "Share"]} contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22}>
                          {cd.map((seg) => <Cell key={seg.name} fill={seg.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
            </div>

            {/* Right: Demographics */}
            {data.demographics && (data.demographics.male !== null || data.demographics.ageGroups.length > 0) ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5">
                <div className="text-[10px] uppercase tracking-[0.14em] font-black text-slate-400 mb-3">Searchers&rsquo; Age Range</div>

                {/* Gender split */}
                {data.demographics.male !== null && data.demographics.female !== null && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-slate-500 mb-1.5">Gender Split</div>
                    <div className="flex rounded-full overflow-hidden h-5 gap-0.5">
                      <div className="bg-blue-400 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${data.demographics.male}%` }}>
                        {data.demographics.male >= 20 ? `${data.demographics.male}%` : ""}
                      </div>
                      <div className="bg-pink-400 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${data.demographics.female}%` }}>
                        {data.demographics.female >= 20 ? `${data.demographics.female}%` : ""}
                      </div>
                    </div>
                    <div className="flex justify-between mt-1 text-[11px]">
                      <span className="text-blue-500 font-semibold">♂ Male {data.demographics.male}%</span>
                      <span className="text-pink-500 font-semibold">Female {data.demographics.female}% ♀</span>
                    </div>
                  </div>
                )}

                {/* Age range recharts */}
                {data.demographics.ageGroups.length > 0 && (() => {
                  const maxIdx = Math.max(...data.demographics!.ageGroups.map((a) => a.index), 1);
                  const ageData = data.demographics!.ageGroups.map((ag) => ({
                    label: ag.label,
                    value: Math.round((ag.index / maxIdx) * 100),
                    raw: ag.index,
                  }));
                  return (
                    <div>
                      <div className="text-xs font-semibold text-slate-500 mb-2">Age Groups</div>
                      <ResponsiveContainer width="100%" height={Math.max(ageData.length * 34, 120)}>
                        <BarChart data={ageData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                          <XAxis type="number" hide domain={[0, 100]} />
                          <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} width={48} />
                          <Tooltip formatter={(v) => [`${v} (index)`, "Relative interest"]} contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                          <Bar dataKey="value" fill="#f15b27" radius={[0, 6, 6, 0]} maxBarSize={22} label={{ position: "right", fontSize: 11, fill: "#94a3b8", formatter: (v: unknown) => `${v}` }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 flex items-center justify-center text-slate-400 text-sm">
                Demographics data unavailable for this keyword
              </div>
            )}
          </div>

          {/* ── 4. KEYWORD IDEAS ── */}
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
                    className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                      ideasTab === tab.id ? "border-[#f15b27] text-[#f15b27]" : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{tab.count}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {/* Suggestions — top related keywords with metrics */}
              {ideasTab === "suggestions" && (
                <KwTable rows={data.relatedKeywords ?? []} onSelect={setKeyword} />
              )}

              {/* Related — same as suggestions (deduplicated data) */}
              {ideasTab === "related" && (
                <KwTable rows={(data.relatedKeywords ?? []).slice(0, 30)} onSelect={setKeyword} />
              )}

              {/* Questions */}
              {ideasTab === "questions" && (
                <div className="space-y-4">
                  {(data.questions?.length ?? 0) > 0 && (
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">From Autocomplete ({data.questions!.length})</div>
                      <SimpleKwList keywords={data.questions!} onSelect={setKeyword} />
                    </div>
                  )}
                  {data.paa?.length > 0 && (
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 mt-4">People Also Ask ({data.paa.length})</div>
                      <div className="space-y-2">
                        {data.paa.map((item, i) => <PaaRow key={i} item={item} />)}
                      </div>
                    </div>
                  )}
                  {!(data.questions?.length) && !data.paa?.length && <p className="text-slate-500 text-sm">No question data available.</p>}
                </div>
              )}

              {/* Prepositions */}
              {ideasTab === "prepositions" && (
                <SimpleKwList keywords={data.prepositions ?? []} onSelect={setKeyword} />
              )}

              {/* Comparisons */}
              {ideasTab === "comparisons" && (
                <SimpleKwList keywords={data.comparisons ?? []} onSelect={setKeyword} />
              )}

              {/* Top Content (Citations) */}
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

          {/* ── 5. TOP ORGANIC RESULTS ── */}
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

          {/* ── 6. LIGHTHOUSE (optional) ── */}
          {data.domain && (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5">
              <div className="text-[10px] uppercase tracking-[0.14em] font-black text-[#f15b27] mb-0.5">Lighthouse Audit</div>
              <h2 className="text-lg font-black text-slate-900 mb-4">{data.domain}</h2>
              {!data.lighthouse ? (
                <p className="text-slate-500 text-sm">Lighthouse data unavailable.{data.errors.lighthouse && <span className="ml-1 text-red-500">{data.errors.lighthouse}</span>}</p>
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
