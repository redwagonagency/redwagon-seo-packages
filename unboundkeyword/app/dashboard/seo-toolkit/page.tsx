"use client";

import { useState } from "react";
import type { ToolkitResult, ToolkitMode } from "@/app/api/seo-toolkit/route";

const MODE_LABELS: Record<ToolkitMode, string> = {
  keyword: "Keyword",
  domain: "Domain",
  page: "Page URL",
};

const MODE_PLACEHOLDERS: Record<ToolkitMode, string> = {
  keyword: "best local seo services",
  domain: "competitor.com",
  page: "https://example.com/your-page",
};

function KvRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className="text-xs font-bold text-slate-800 text-right">{value}</span>
    </div>
  );
}

export default function SeoToolkitPage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<ToolkitMode>("keyword");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ToolkitResult | null>(null);

  async function runQuery() {
    const q = query.trim();
    if (!q) { setError("Enter a keyword, domain, or URL."); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/seo-toolkit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, mode }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `Error ${res.status}`);
      }
      setResult((await res.json()) as ToolkitResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.18em] text-[#f15b27] font-black mb-1">SEO Toolkit</div>
        <h1 className="text-3xl font-black text-slate-900">Unified SEO Lookup</h1>
        <p className="text-sm text-slate-500 mt-1">
          Enter a keyword, domain, or page URL to instantly pull metrics, SERP features, AI overview likelihood, backlinks, and more.
        </p>
      </div>

      {/* Input */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-6">
        {/* Mode tabs */}
        <div className="flex gap-1 mb-4 rounded-xl bg-slate-100 p-1 w-fit">
          {(["keyword", "domain", "page"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setQuery(""); setResult(null); setError(null); }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${mode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") runQuery(); }}
            placeholder={MODE_PLACEHOLDERS[mode]}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f15b27]/30 focus:border-[#f15b27]"
          />
          <button
            onClick={runQuery}
            disabled={loading}
            className="rounded-xl bg-[#f15b27] text-white text-sm font-black px-6 py-2.5 hover:bg-[#d94e20] transition disabled:opacity-60"
          >
            {loading ? "…" : "Analyse →"}
          </button>
        </div>
        {error && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Keyword mode */}
          {result.mode === "keyword" && result.keyword && (
            <>
              {result.keyword.overview && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Keyword Metrics</div>
                  <div className="grid sm:grid-cols-2 gap-x-8">
                    <KvRow label="Search Volume" value={result.keyword.overview.volume?.toLocaleString()} />
                    <KvRow label="CPC" value={result.keyword.overview.cpc != null ? `$${Number(result.keyword.overview.cpc).toFixed(2)}` : null} />
                    <KvRow label="SEO Difficulty" value={result.keyword.overview.difficulty} />
                    <KvRow label="Competition" value={result.keyword.overview.competition != null ? `${Math.round(Number(result.keyword.overview.competition) * 100)}%` : null} />
                    <KvRow label="Intent" value={result.keyword.overview.intent} />
                  </div>
                </div>
              )}

              {result.keyword.aiInsight && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">AI Overview Signal</div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${result.keyword.aiInsight.hasSummary ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-500"}`}>
                      {result.keyword.aiInsight.hasSummary ? "AI Overview present" : "No AI Overview detected"}
                    </span>
                  </div>
                  {result.keyword.aiInsight.summaryText && (
                    <p className="text-sm text-slate-600 leading-6">{result.keyword.aiInsight.summaryText}</p>
                  )}
                </div>
              )}

              {result.keyword.serpFeatures && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">SERP Features</div>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(result.keyword.serpFeatures) as [string, boolean][])
                      .filter(([, v]) => v === true)
                      .map(([k]) => (
                        <span key={k} className="text-xs bg-sky-100 text-sky-700 px-2.5 py-1 rounded-lg font-medium capitalize">
                          {k.replace(/([A-Z])/g, " $1").replace(/^has /, "").trim()}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {result.keyword.relatedIdeas.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Related Keyword Ideas</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                          <th className="py-2 pr-4">Keyword</th>
                          <th className="py-2 pr-4">Volume</th>
                          <th className="py-2">CPC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {result.keyword.relatedIdeas.map((idea) => (
                          <tr key={idea.keyword}>
                            <td className="py-1.5 pr-4 text-slate-700">{idea.keyword}</td>
                            <td className="py-1.5 pr-4 text-slate-600">{idea.volume.toLocaleString()}</td>
                            <td className="py-1.5 text-slate-600">{idea.cpc != null ? `$${idea.cpc.toFixed(2)}` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Domain mode */}
          {result.mode === "domain" && result.domain && (
            <>
              {result.domain.rankOverview && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Domain Overview</div>
                  <div className="grid sm:grid-cols-2 gap-x-8">
                    <KvRow label="Organic Keywords" value={result.domain.rankOverview.organicKeywords?.toLocaleString()} />
                    <KvRow label="Organic Traffic (est.)" value={result.domain.rankOverview.organicTraffic?.toLocaleString()} />
                    <KvRow label="Paid Keywords" value={result.domain.rankOverview.paidKeywords?.toLocaleString()} />
                    <KvRow label="Domain Rank" value={result.domain.rankOverview.domainRank} />
                  </div>
                </div>
              )}
              {result.domain.backlinkProfile && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Backlink Profile</div>
                  <div className="grid sm:grid-cols-2 gap-x-8">
                    <KvRow label="Total Backlinks" value={result.domain.backlinkProfile.backlinksTotal?.toLocaleString()} />
                    <KvRow label="Referring Domains" value={result.domain.backlinkProfile.referringDomains?.toLocaleString()} />
                    <KvRow label="Domain Rank" value={result.domain.backlinkProfile.domainRank} />
                    <KvRow label="Spam Score" value={result.domain.backlinkProfile.spamScore != null ? `${result.domain.backlinkProfile.spamScore}%` : null} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Page mode */}
              {result.page && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">On-Page Audit</div>
                  <div className="grid sm:grid-cols-2 gap-x-8">
                    <KvRow label="Title" value={result.page.title} />
                    <KvRow label="Description" value={result.page.description} />
                    <KvRow label="Score" value={result.page.score} />
                    <KvRow label="Status Code" value={result.page.responseCode} />
                    <KvRow label="Issues Found" value={result.page.issues?.length ?? 0} />
                    <KvRow label="Load Time" value={result.page.loadTimeMs != null ? `${result.page.loadTimeMs}ms` : null} />
                  </div>
              {result.page.issues && result.page.issues.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Issues</div>
                  <ul className="space-y-1">
                    {result.page.issues.slice(0, 10).map((issue, i) => (
                      <li key={i} className="flex gap-2 text-xs text-slate-600">
                        <span className="text-rose-400 shrink-0">•</span>
                        {"message" in issue ? String(issue.message) : JSON.stringify(issue)}
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
  );
}
