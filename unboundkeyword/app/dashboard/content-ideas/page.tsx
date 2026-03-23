"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/utils";
import SaveToListModal, { type KWToSave } from "@/components/dashboard/SaveToListModal";
import type { ContentIdea, ContentIdeasResponse } from "@/app/api/content-ideas/route";

const INTENT_COLORS: Record<string, string> = {
  informational: "bg-blue-100 text-blue-700",
  commercial: "bg-amber-100 text-amber-700",
  transactional: "bg-green-100 text-green-700",
  navigational: "bg-slate-100 text-slate-600",
};

const TYPE_COLORS: Record<string, string> = {
  "How-To Guide": "bg-indigo-100 text-indigo-700",
  "Review / Comparison": "bg-pink-100 text-pink-700",
  "Listicle / Best Of": "bg-orange-100 text-orange-700",
  "Definition / What Is": "bg-cyan-100 text-cyan-700",
  "Tool / Template": "bg-purple-100 text-purple-700",
  "Case Study": "bg-emerald-100 text-emerald-700",
  Article: "bg-slate-100 text-slate-600",
};

export default function ContentIdeasPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<ContentIdeasResponse | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showSave, setShowSave] = useState(false);
  const [activeTab, setActiveTab] = useState<"ideas" | "pages">("ideas");

  async function runSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setSelected(new Set());
    try {
      const res = await fetch("/api/content-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: query.trim(), limit: 60 }),
      });
      const json = (await res.json()) as ContentIdeasResponse & { error?: string };
      if (!res.ok) throw new Error(json.error || "Failed");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function toggleRow(kw: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(kw) ? n.delete(kw) : n.add(kw); return n; });
  }

  function toggleAll() {
    const all = data?.ideas ?? [];
    setSelected(selected.size === all.length ? new Set() : new Set(all.map((r) => r.keyword)));
  }

  const saveItems: KWToSave[] = [...selected].map((kw) => {
    const r = data?.ideas.find((i) => i.keyword === kw);
    return { keyword: kw, volume: r?.volume ?? 0, cpc: r?.cpc ?? undefined, difficulty: undefined };
  });

  const ideas = data?.ideas ?? [];
  const topPages = data?.topPages ?? [];

  return (
    <div className="p-8 max-w-7xl">
      <h1 className="text-4xl font-black text-slate-900 mb-1">Content Ideas</h1>
      <p className="text-sm text-slate-500 mb-6">Discover keyword-driven content opportunities with intent, trend signals, and content type suggestions.</p>

      <div className="flex gap-2 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void runSearch()}
          placeholder="Enter a topic or seed keyword…"
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#f15b27]"
        />
        <button type="button" onClick={() => void runSearch()} disabled={loading}
          className="rounded-lg bg-[#f15b27] px-6 py-2.5 text-sm font-black text-white hover:bg-[#d94e1f] disabled:opacity-60">
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}

      {data && (
        <>
          <div className="flex gap-2 mb-4 border-b border-slate-200">
            {(["ideas", "pages"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setActiveTab(t)}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === t ? "border-[#f15b27] text-[#f15b27]" : "border-transparent text-slate-500"}`}>
                {t === "ideas" ? `Content Ideas (${ideas.length})` : `Top Pages (${topPages.length})`}
              </button>
            ))}
            {selected.size > 0 && (
              <button type="button" onClick={() => setShowSave(true)}
                className="ml-auto mb-1 rounded-full px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white self-center">
                Add {selected.size} to List
              </button>
            )}
          </div>

          {activeTab === "ideas" && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex justify-between">
                <span className="text-sm font-semibold text-slate-700">{formatNumber(ideas.length)} ideas</span>
                <button type="button" onClick={() => {
                  const csv = ["keyword,volume,cpc,intent,content_type,trending"].concat(ideas.map((r) => `"${r.keyword}",${r.volume},${r.cpc ?? ""},${r.intent ?? ""},${r.contentType ?? ""},${r.trending}`)).join("\n");
                  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "content-ideas.csv"; a.click();
                }} className="text-xs text-[#f15b27] hover:underline">Export CSV</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                      <th className="px-4 py-3 w-8"><input type="checkbox" checked={selected.size === ideas.length && ideas.length > 0} onChange={toggleAll} className="rounded" /></th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Keyword / Topic</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Volume</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">CPC</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Intent</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Content Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ideas.map((row) => (
                      <tr key={row.keyword} onClick={() => toggleRow(row.keyword)}
                        className={`border-b border-slate-50 cursor-pointer hover:bg-slate-50 ${selected.has(row.keyword) ? "bg-orange-50" : ""}`}>
                        <td className="px-4 py-2.5"><input type="checkbox" checked={selected.has(row.keyword)} onChange={() => toggleRow(row.keyword)} onClick={(e) => e.stopPropagation()} className="rounded" /></td>
                        <td className="px-4 py-2.5 font-medium text-slate-800">
                          {row.keyword}
                          {row.topDomain && <span className="ml-2 text-xs text-slate-400">→ {row.topDomain}</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{row.volume > 0 ? formatNumber(row.volume) : "—"}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{row.cpc != null ? `$${row.cpc.toFixed(2)}` : "—"}</td>
                        <td className="px-4 py-2.5">
                          {row.intent ? <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${INTENT_COLORS[row.intent] ?? "bg-slate-100 text-slate-600"}`}>{row.intent}</span> : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          {row.contentType ? <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_COLORS[row.contentType] ?? "bg-slate-100 text-slate-600"}`}>{row.contentType}</span> : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-sm ${row.trendDirection === "up" ? "text-emerald-500" : row.trendDirection === "down" ? "text-red-400" : "text-slate-400"}`}>
                            {row.trendDirection === "up" ? "↑" : row.trendDirection === "down" ? "↓" : "→"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "pages" && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Page Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Domain</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">URL</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.map((page, idx) => (
                    <tr key={page.url} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-slate-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800 max-w-xs truncate">{page.title}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{page.domain}</td>
                      <td className="px-4 py-2.5 text-xs text-[#f15b27] truncate max-w-[200px]">
                        <a href={page.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{page.url}</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!loading && !error && !data && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          Enter a topic or seed keyword above to discover content opportunities.
        </div>
      )}

      {showSave && (
        <SaveToListModal keywords={saveItems} onClose={() => setShowSave(false)} onSaved={() => { setShowSave(false); setSelected(new Set()); }} />
      )}
    </div>
  );
}
