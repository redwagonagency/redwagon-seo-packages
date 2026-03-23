"use client";

import { useMemo, useState, type FormEvent } from "react";

const PLATFORM_TABS = [
  { id: "google",    label: "Google",    color: "#EA4335", icon: "G"  },
  { id: "shopping",  label: "Shopping",  color: "#0F9D58", icon: "S"  },
  { id: "youtube",   label: "YouTube",   color: "#FF0000", icon: "▶"  },
  { id: "amazon",    label: "Amazon",    color: "#FF9900", icon: "A"  },
  { id: "bing",      label: "Bing",      color: "#008373", icon: "B"  },
  { id: "facebook",  label: "Facebook",  color: "#1877F2", icon: "F"  },
  { id: "pinterest", label: "Pinterest", color: "#E60023", icon: "P"  },
  { id: "instagram", label: "Instagram", color: "#C13584", icon: "IG" },
  { id: "tiktok",    label: "TikTok",    color: "#555555", icon: "TT" },
  { id: "chatgpt",   label: "ChatGPT",   color: "#10A37F", icon: "AI" },
];

export default function DashboardSearch() {
  const [query, setQuery]               = useState("");
  const [activePlatform, setActivePlatform] = useState("google");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Array<{ keyword: string; volume: number | null; cpc: number | null; difficulty: number | null; intent: string | null; source: string }>>([]);
const [hashtags, setHashtags] = useState<Array<{ keyword: string; hashtag: string; platform: string; estPosts: number; intent: string | null }>>([]);

  const hasResults = results.length > 0 || hashtags.length > 0;

  const topResults = useMemo(() => results.slice(0, 50), [results]);
  const topHashtags = useMemo(() => hashtags.slice(0, 24), [hashtags]);

  async function runInlineSearch(term: string) {
    const q = term.trim();
    if (!q) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/overview-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: q, platform: activePlatform }),
      });

      const data = (await res.json()) as {
        error?: string;
        results?: Array<{ keyword: string; volume: number | null; cpc: number | null; difficulty: number | null; intent: string | null; source: string }>;
        aiPhraseAnalysis?: Array<{ phrase: string; category: string; volume: number | null; cpc: number | null; difficulty: number | null; intent: string | null; opportunityScore: number; recommendation: string }>;
        hashtagSuggestions?: Array<{ keyword: string; hashtag: string; platform: string; estPosts: number; intent: string | null }>;
      };

      if (!res.ok) throw new Error(data.error || "Search failed");

      setResults(data.results ?? []);
      setHashtags(data.hashtagSuggestions ?? []);
    } catch (e) {
      setResults([]);
      setHashtags([]);
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    void runInlineSearch(query);
  }

  const active = PLATFORM_TABS.find(t => t.id === activePlatform)!;

  return (
    <div className="mb-8 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#f15b27] mb-0.5">
            KEYWORD DISCOVERY
          </div>
          <p className="text-[13px] text-slate-500">
            See what people search across <span className="font-semibold text-slate-700">51 billion</span> daily queries on every major platform
          </p>
        </div>
        {/* Live platform badge */}
        <div
          className="shrink-0 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-sm"
          style={{ background: active.color }}
        >
          <span>{active.icon}</span>
          <span>{active.label}</span>
        </div>
      </div>

      {/* Platform tabs */}
      <div className="px-6 pt-3 pb-0 flex flex-wrap gap-2">
        {PLATFORM_TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActivePlatform(tab.id)}
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition",
              activePlatform === tab.id
                ? "text-white shadow-sm"
                : "text-slate-500 bg-slate-50 border-slate-200 hover:border-slate-300 hover:text-slate-700",
            ].join(" ")}
            style={
              activePlatform === tab.id
                ? { background: tab.color, borderColor: tab.color }
                : {}
            }
          >
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black"
              style={
                activePlatform === tab.id
                  ? { background: "rgba(255,255,255,0.25)" }
                  : { background: tab.color, color: "#fff" }
              }
            >
              {tab.icon.slice(0, 1)}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="px-6 py-4 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:border-[#f15b27] focus-within:ring-2 focus-within:ring-[#f15b27]/10 transition">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Enter a keyword to explore on ${active.label}…`}
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-500 outline-none min-w-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-slate-300 hover:text-slate-500 transition shrink-0"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="shrink-0 flex items-center gap-2 rounded-xl bg-[#f15b27] hover:bg-[#d94e1f] text-white text-sm font-bold px-5 py-2.5 transition shadow-md shadow-orange-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {loading ? "Searching..." : "Discover"}
        </button>
      </form>

      {/* Quick searches hint */}
      <div className="px-6 pb-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-slate-400 font-medium shrink-0">Try:</span>
        {["coffee subscription", "shopify seo", "local seo", "email marketing", "running shoes"].map(preset => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setQuery(preset);
              void runInlineSearch(preset);
            }}
            className="text-[11px] text-[#f15b27] font-semibold border border-[#f15b27]/25 bg-[#fff3ee] rounded-full px-2.5 py-0.5 hover:bg-[#ffe4d6] transition"
          >
            {preset}
          </button>
        ))}
      </div>

      {error ? (
        <div className="px-6 pb-4">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        </div>
      ) : null}

      {hasResults ? (
        <div className="px-6 pb-6 grid gap-4 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Platform Results ({topResults.length})</h3>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{active.label}</span>
            </div>
            <div className="max-h-[360px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] text-slate-500 uppercase tracking-wider">Keyword</th>
                    <th className="px-3 py-2 text-right text-[11px] text-slate-500 uppercase tracking-wider">Volume</th>
                    <th className="px-3 py-2 text-right text-[11px] text-slate-500 uppercase tracking-wider">CPC</th>
                  </tr>
                </thead>
                <tbody>
                  {topResults.map((row) => (
                    <tr key={`${row.keyword}-${row.source}`} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-900 font-medium">{row.keyword}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{row.volume != null ? row.volume.toLocaleString() : "-"}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{row.cpc != null ? `$${row.cpc.toFixed(2)}` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Question Keywords</h3>
              <p className="text-xs text-slate-500 mt-1">Real searcher questions ranked by volume — great for FAQ, featured snippets &amp; blog posts.</p>
            </div>
            <div className="max-h-[360px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] text-slate-500 uppercase tracking-wider">Question</th>
                    <th className="px-3 py-2 text-right text-[11px] text-slate-500 uppercase tracking-wider">Vol</th>
                    <th className="px-3 py-2 text-right text-[11px] text-slate-500 uppercase tracking-wider">KD</th>
                  </tr>
                </thead>
                <tbody>
                  {topResults
                    .filter(r => /^(how|what|why|when|where|who|which|can|is|are|does|do|should|will|would|could)\b/i.test(r.keyword))
                    .slice(0, 20)
                    .map((row) => (
                    <tr key={`q-${row.keyword}`} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-900 font-medium">{row.keyword}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{row.volume != null ? row.volume.toLocaleString() : "—"}</td>
                      <td className="px-3 py-2 text-right">
                        {row.difficulty != null ? (
                          <span className={`font-bold ${row.difficulty < 30 ? "text-emerald-600" : row.difficulty < 60 ? "text-amber-600" : "text-red-500"}`}>{row.difficulty}</span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                  {topResults.filter(r => /^(how|what|why|when|where|who|which|can|is|are|does|do|should|will|would|could)\b/i.test(r.keyword)).length === 0 && (
                    <tr><td colSpan={3} className="px-3 py-8 text-center text-xs text-slate-400">Run a search to see question keywords</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Hashtag Search By Platform</h3>
              <p className="text-xs text-slate-500 mt-1">Hashtag ideas generated from platform keyword outputs.</p>
            </div>
            <div className="max-h-[360px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] text-slate-500 uppercase tracking-wider">Hashtag</th>
                    <th className="px-3 py-2 text-right text-[11px] text-slate-500 uppercase tracking-wider">Est Posts</th>
                  </tr>
                </thead>
                <tbody>
                  {topHashtags.map((row) => (
                    <tr key={`${row.platform}-${row.hashtag}`} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-900 font-medium">
                        <div>{row.hashtag}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{row.keyword}</div>
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">{row.estPosts.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
