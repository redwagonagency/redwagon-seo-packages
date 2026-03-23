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
import type { CitationItem, PhraseTrendItem, PaidSearchData, DemographicsData } from "@/app/api/keyword-overview/route";

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
  errors: Record<string, string>;
}

type Tab = "serp" | "paa" | "autocomplete" | "citations" | "trends" | "ai" | "llm" | "lighthouse";

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

const MAX_TREND_BAR = (items: PhraseTrendItem[]) =>
  Math.max(...items.map((i) => i.impressions), 1);

export default function KeywordOverviewPage() {
  const [keyword, setKeyword] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("serp");

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const tabs: { id: Tab; label: string; count?: number }[] = data
    ? [
        { id: "serp", label: "Top Results", count: data.serp.length },        { id: "paa", label: "People Also Ask", count: data.paa?.length ?? 0 },        { id: "autocomplete", label: "A–Z Autocomplete", count: data.autocomplete.filter((g) => g.suggestions.length > 0).length },
        { id: "citations", label: "Citations", count: data.citations.length },
        { id: "trends", label: "Phrase Trends", count: data.phraseTrends.length },
        { id: "ai", label: "AI Volume", count: data.aiVolume.length },
        { id: "llm", label: "LLM Mentions", count: data.llmMentions.length },
        ...(data.domain ? [{ id: "lighthouse" as Tab, label: "Lighthouse" }] : []),
      ]
    : [];

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 mb-6">
        <div className="text-xs uppercase tracking-[0.16em] text-[#f15b27] font-black mb-1">
          Keyword Overview
        </div>
        <h1 className="text-3xl font-black text-slate-900">Live Keyword Intelligence</h1>
        <p className="text-sm text-slate-600 mt-2">
          SERP insights, A–Z autocomplete, citations, phrase trends, AI search volume, LLM mentions,
          and a free Lighthouse audit — all in one place.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white px-6 py-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter a keyword…"
            className="flex-1"
            required
          />
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Domain for Lighthouse (optional)"
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !keyword.trim()}>
            {loading ? "Analyzing…" : "Analyze"}
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {data && Object.keys(data.errors).length > 0 && (
          <p className="mt-2 text-xs text-amber-600">
            Partial results — some sections failed:{" "}
            {Object.keys(data.errors).join(", ")}
          </p>
        )}
      </form>

      {/* Loading skeleton */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 flex items-center justify-center gap-3 text-slate-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Fetching live data across 7 sources…
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          {/* Paid Search Metrics card */}
          {data.paid && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-b border-slate-200">
              <div className="flex flex-col gap-0.5 px-5 py-4 border-r border-slate-100">
                <span className="text-[10px] uppercase tracking-[0.16em] font-black text-slate-400">Monthly Volume</span>
                <span className="text-2xl font-black text-slate-900 tabular-nums">
                  {data.paid.searchVolume != null ? data.paid.searchVolume.toLocaleString() : "—"}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 px-5 py-4 border-r border-slate-100">
                <span className="text-[10px] uppercase tracking-[0.16em] font-black text-slate-400">CPC (Google Ads)</span>
                <span className="text-2xl font-black text-slate-900 tabular-nums">
                  {data.paid.cpc != null ? `$${data.paid.cpc.toFixed(2)}` : "—"}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 px-5 py-4 border-r border-slate-100">
                <span className="text-[10px] uppercase tracking-[0.16em] font-black text-slate-400">Paid Competition</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-[#f15b27]"
                      style={{ width: `${Math.round((data.paid.competition ?? 0) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-black text-slate-700 tabular-nums w-9 text-right">
                    {data.paid.competition != null ? `${Math.round(data.paid.competition * 100)}%` : "—"}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 px-5 py-4">
                <span className="text-[10px] uppercase tracking-[0.16em] font-black text-slate-400">Competition Level</span>
                <span className={`text-sm font-black tabular-nums mt-1 ${
                  data.paid.competitionLevel === "HIGH" ? "text-red-600" :
                  data.paid.competitionLevel === "MEDIUM" ? "text-amber-500" : "text-green-600"
                }`}>
                  {data.paid.competitionLevel ?? "—"}
                </span>
              </div>
            </div>
          )}
          {/* Tabs */}
          {/* Demographics card */}
          {data.demographics && (data.demographics.male !== null || data.demographics.ageGroups.length > 0) && (
            <div className="mx-6 mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] font-black text-slate-400 mb-3">Audience Demographics</p>
              <div className="flex flex-col md:flex-row gap-6">
                {data.demographics.male !== null && data.demographics.female !== null && (
                  <div className="min-w-[160px]">
                    <p className="text-xs text-slate-500 mb-1">Gender</p>
                    <div className="flex rounded-full overflow-hidden h-3 text-[10px] font-bold">
                      <div className="bg-blue-400" style={{ width: `${data.demographics.male}%` }} title={`Male ${data.demographics.male}%`} />
                      <div className="bg-pink-400" style={{ width: `${data.demographics.female}%` }} title={`Female ${data.demographics.female}%`} />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                      <span className="text-blue-500 font-semibold">M {data.demographics.male}%</span>
                      <span className="text-pink-500 font-semibold">F {data.demographics.female}%</span>
                    </div>
                  </div>
                )}
                {data.demographics.ageGroups.length > 0 && (
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-1">Age Groups (index)</p>
                    <div className="flex items-end gap-1.5">
                      {data.demographics.ageGroups.map((ag) => {
                        const maxIdx = Math.max(...data.demographics!.ageGroups.map((a) => a.index), 1);
                        return (
                          <div key={ag.label} className="flex flex-col items-center gap-0.5">
                            <div className="bg-[#f15b27] rounded-sm w-6" style={{ height: `${Math.max(Math.round((ag.index / maxIdx) * 48), 2)}px` }} />
                            <span className="text-[9px] text-slate-400 text-center leading-tight">{ag.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Tabs */}
          <div className="border-b border-slate-200 overflow-x-auto">
            <div className="flex gap-0 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-[#f15b27] text-[#f15b27]"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* ── SERP Tab ── */}
            {activeTab === "serp" && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  Top Organic Results for &ldquo;{data.keyword}&rdquo;
                </h2>
                {data.serp.length === 0 ? (
                  <p className="text-slate-500 text-sm">No SERP data available.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                          <th className="pb-2 pr-3 w-10">#</th>
                          <th className="pb-2 pr-3">Domain</th>
                          <th className="pb-2 pr-3">Title &amp; URL</th>
                          <th className="pb-2 text-right w-20">ETV</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.serp.map((r) => (
                          <tr key={r.url} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="py-3 pr-3 font-mono text-slate-400">{r.position}</td>
                            <td className="py-3 pr-3">
                              <div className="flex items-center gap-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={`https://www.google.com/s2/favicons?domain=${r.domain}&sz=16`}
                                  alt=""
                                  width={16}
                                  height={16}
                                  className="rounded-sm flex-shrink-0"
                                />
                                <span className="font-medium text-slate-700">{r.domain}</span>
                              </div>
                            </td>
                            <td className="py-3 pr-3">
                              <div className="font-semibold text-slate-900 leading-snug">{r.title}</div>
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[#f15b27] hover:underline truncate block max-w-sm"
                              >
                                {r.url}
                              </a>
                              {r.description && (
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{r.description}</p>
                              )}
                            </td>
                            <td className="py-3 text-right font-mono text-slate-600">
                              {r.etv !== null ? r.etv.toLocaleString() : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── People Also Ask Tab ── */}
            {activeTab === "paa" && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  People Also Ask for &ldquo;{data.keyword}&rdquo;
                </h2>
                {!data.paa?.length ? (
                  <p className="text-slate-500 text-sm">No People Also Ask data available.</p>
                ) : (
                  <div className="space-y-2">
                    {data.paa.map((item, i) => (
                      <PaaRow key={i} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Autocomplete Tab ── */}
            {activeTab === "autocomplete" && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  A–Z Autocomplete for &ldquo;{data.keyword}&rdquo;
                </h2>
                {data.autocomplete.every((g) => g.suggestions.length === 0) ? (
                  <p className="text-slate-500 text-sm">No autocomplete suggestions found.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {data.autocomplete
                      .filter((g) => g.suggestions.length > 0)
                      .map((group) => (
                        <div key={group.letter} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <div className="text-xs font-black uppercase text-[#f15b27] mb-2">
                            {group.letter.toUpperCase()}
                          </div>
                          <ul className="space-y-1">
                            {group.suggestions.map((s) => (
                              <li key={s}>
                                <button
                                  type="button"
                                  onClick={() => setKeyword(s)}
                                  className="text-xs text-slate-700 hover:text-[#f15b27] text-left w-full truncate"
                                >
                                  {s}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Citations Tab ── */}
            {activeTab === "citations" && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  Content Citations for &ldquo;{data.keyword}&rdquo;
                </h2>
                {data.citations.length === 0 ? (
                  <p className="text-slate-500 text-sm">No citation data available.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {data.citations.map((c, i) => (
                      <li key={i} className="py-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-900 text-sm leading-snug">
                              {c.title || c.domain || "Untitled"}
                            </div>
                            {c.url && (
                              <a
                                href={c.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[#f15b27] hover:underline truncate block"
                              >
                                {c.url}
                              </a>
                            )}
                            {c.snippet && (
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{c.snippet}</p>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 whitespace-nowrap">
                            {c.contentDate ? c.contentDate.slice(0, 10) : null}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* ── Phrase Trends Tab ── */}
            {activeTab === "trends" && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  Phrase Trends for &ldquo;{data.keyword}&rdquo;
                </h2>
                {data.phraseTrends.length === 0 ? (
                  <p className="text-slate-500 text-sm">No phrase trend data available.</p>
                ) : (
                  <div>
                    <p className="text-xs text-slate-500 mb-4">
                      Impressions count across indexed content over time.
                    </p>
                    <div className="flex items-end gap-px h-40 overflow-x-auto">
                      {(() => {
                        const max = MAX_TREND_BAR(data.phraseTrends);
                        return data.phraseTrends.map((pt, i) => (
                          <div
                            key={i}
                            className="relative group flex-shrink-0"
                            style={{ width: "max(8px, calc(100% / " + data.phraseTrends.length + "))" }}
                          >
                            <div
                              className="bg-[#f15b27] opacity-80 hover:opacity-100 rounded-t transition-opacity w-full"
                              style={{ height: `${(pt.impressions / max) * 100}%` }}
                            />
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                              {pt.date}: {pt.impressions.toLocaleString()}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-slate-400">
                      <span>{data.phraseTrends[0]?.date?.slice(0, 7)}</span>
                      <span>{data.phraseTrends[data.phraseTrends.length - 1]?.date?.slice(0, 7)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── AI Volume Tab ── */}
            {activeTab === "ai" && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  AI Search Volume for &ldquo;{data.keyword}&rdquo;
                </h2>
                {data.aiVolume.length === 0 ? (
                  <p className="text-slate-500 text-sm">No AI volume data available.</p>
                ) : (
                  <div className="space-y-6">
                    {data.aiVolume.map((item) => (
                      <div key={item.keyword}>
                        <div className="flex items-baseline gap-3 mb-3">
                          <div className="text-4xl font-black text-slate-900">
                            {item.searchVolume !== null
                              ? item.searchVolume.toLocaleString()
                              : "—"}
                          </div>
                          <div className="text-sm text-slate-500">AI searches / mo</div>
                        </div>
                        {item.breakdown.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                              By Model
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {item.breakdown.map((b) => (
                                <div
                                  key={b.model}
                                  className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm"
                                >
                                  <span className="font-semibold text-slate-700">{b.model}</span>
                                  <span className="ml-2 text-slate-500">{b.volume.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── LLM Mentions Tab ── */}
            {activeTab === "llm" && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  LLM Mentions for &ldquo;{data.keyword}&rdquo;
                  {data.domain && (
                    <span className="ml-2 text-base font-normal text-slate-500">
                      — domain: {data.domain}
                    </span>
                  )}
                </h2>
                {data.llmMentions.length === 0 ? (
                  <p className="text-slate-500 text-sm">
                    No LLM mention data.{!data.domain && " Enter a domain to see if it's mentioned."}
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {data.llmMentions.map((m, i) => (
                      <li key={i} className="py-3 flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex-shrink-0 h-4 w-4 rounded-full ${
                            m.mentioned ? "bg-green-500" : "bg-slate-200"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              {m.llm}
                            </span>
                            {m.mentioned && (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                                Mentioned
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-slate-900 text-sm mt-0.5">
                            {m.title || m.query}
                          </div>
                          {m.url && (
                            <a
                              href={m.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#f15b27] hover:underline truncate block"
                            >
                              {m.url}
                            </a>
                          )}
                          {m.snippet && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{m.snippet}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* ── Lighthouse Tab ── */}
            {activeTab === "lighthouse" && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">
                  Lighthouse Audit — {data.domain}
                </h2>
                {!data.lighthouse ? (
                  <p className="text-slate-500 text-sm">
                    Lighthouse data unavailable.
                    {data.errors.lighthouse && (
                      <span className="ml-1 text-red-500">{data.errors.lighthouse}</span>
                    )}
                  </p>
                ) : (
                  <div>
                    {/* Score dials */}
                    <div className="flex flex-wrap gap-8 mb-8">
                      <ScoreDial label="Performance" value={data.lighthouse.performance} />
                      <ScoreDial label="Accessibility" value={data.lighthouse.accessibility} />
                      <ScoreDial label="Best Practices" value={data.lighthouse.bestPractices} />
                      <ScoreDial label="SEO" value={data.lighthouse.seo} />
                    </div>

                    {/* Failed audits */}
                    {data.lighthouse.failedAudits.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
                          Issues to Fix
                        </h3>
                        <ul className="space-y-2">
                          {data.lighthouse.failedAudits.map((a) => (
                            <li
                              key={a.id}
                              className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5"
                            >
                              <span
                                className={`flex-shrink-0 mt-0.5 text-xs font-bold px-1.5 py-0.5 rounded uppercase ${
                                  a.impact === "high"
                                    ? "bg-red-200 text-red-800"
                                    : a.impact === "medium"
                                    ? "bg-amber-200 text-amber-800"
                                    : "bg-slate-200 text-slate-600"
                                }`}
                              >
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
        </div>
      )}
    </div>
  );
}
