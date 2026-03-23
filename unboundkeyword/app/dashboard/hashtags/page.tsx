"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/utils";
import SaveToListModal, { type KWToSave } from "@/components/dashboard/SaveToListModal";
import type { HashtagResult, HashtagResponse } from "@/app/api/hashtags/route";

const PLATFORM_COLORS: Record<string, string> = {
  "Google": "bg-blue-100 text-blue-700",
  "Instagram": "bg-pink-100 text-pink-700",
  "TikTok": "bg-slate-800 text-white",
  "Twitter/X": "bg-sky-100 text-sky-700",
  "LinkedIn": "bg-indigo-100 text-indigo-700",
  "YouTube": "bg-red-100 text-red-700",
  "Pinterest": "bg-rose-100 text-rose-700",
  "Facebook": "bg-blue-200 text-blue-800",
};

const ALL_PLATFORMS = ["Google", "Instagram", "TikTok", "Twitter/X", "LinkedIn", "YouTube", "Pinterest", "Facebook"];

function diffColor(v: number | null) {
  if (v === null) return "bg-slate-100 text-slate-500";
  if (v >= 70) return "bg-red-100 text-red-700";
  if (v >= 40) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function HashtagsPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<HashtagResponse | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showSave, setShowSave] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [copied, setCopied] = useState(false);

  async function runSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setSelected(new Set());
    try {
      const res = await fetch("/api/hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: query.trim() }),
      });
      const json = (await res.json()) as HashtagResponse & { error?: string };
      if (!res.ok) throw new Error(json.error || "Failed");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function toggleRow(ht: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(ht) ? n.delete(ht) : n.add(ht); return n; });
  }

  function toggleAll() {
    const all = filteredRows;
    setSelected(selected.size === all.length ? new Set() : new Set(all.map((r) => r.hashtag)));
  }

  function copySelected() {
    const text = [...selected].join(" ");
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const allHashtags = data?.hashtags ?? [];
  const filteredRows = platformFilter === "all" ? allHashtags : allHashtags.filter((h) => h.platform === platformFilter);

  const saveItems: KWToSave[] = [...selected].map((ht) => {
    const r = allHashtags.find((h) => h.hashtag === ht);
    return { keyword: ht, volume: r?.volume ?? 0, cpc: r?.cpc ?? undefined, difficulty: r?.difficulty ?? undefined };
  });

  return (
    <div className="p-8 max-w-7xl">
      <h1 className="text-4xl font-black text-slate-900 mb-1">Hashtag Research</h1>
      <p className="text-sm text-slate-500 mb-6">
        Discover relevant hashtags across Google, Instagram, TikTok, LinkedIn, and more.
        Uses real search volume data to surface the strongest hashtag opportunities.
      </p>

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
          {loading ? "Searching…" : "Find Hashtags"}
        </button>
      </div>

      {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}

      {allHashtags.length > 0 && (
        <>
          {/* Platform filter + actions */}
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <button type="button" onClick={() => setPlatformFilter("all")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${platformFilter === "all" ? "bg-[#f15b27] text-white border-[#f15b27]" : "bg-white text-slate-600 border-slate-200"}`}>
              All Platforms
            </button>
            {ALL_PLATFORMS.map((p) => (
              <button key={p} type="button" onClick={() => setPlatformFilter(p)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${platformFilter === p ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
                {p}
              </button>
            ))}
            <div className="ml-auto flex gap-2">
              {selected.size > 0 && (
                <>
                  <button type="button" onClick={copySelected}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold bg-slate-700 text-white">
                    {copied ? "Copied!" : `Copy ${selected.size}`}
                  </button>
                  <button type="button" onClick={() => setShowSave(true)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white">
                    Add {selected.size} to List
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Hashtag grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {filteredRows.slice(0, 40).map((row) => (
              <div
                key={row.hashtag}
                onClick={() => toggleRow(row.hashtag)}
                className={`rounded-xl border p-4 cursor-pointer transition-all ${selected.has(row.hashtag) ? "border-[#f15b27] bg-orange-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-lg font-black text-slate-900 break-all">{row.hashtag}</span>
                  <input type="checkbox" checked={selected.has(row.hashtag)} onChange={() => toggleRow(row.hashtag)} onClick={(e) => e.stopPropagation()} className="rounded mt-0.5" />
                </div>
                <div className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold mb-2 ${PLATFORM_COLORS[row.platform] ?? "bg-slate-100 text-slate-600"}`}>
                  {row.platform}
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Vol <strong className="text-slate-700">{row.volume != null ? formatNumber(row.volume) : "—"}</strong></span>
                  <span>CPC <strong className="text-slate-700">{row.cpc != null ? `$${row.cpc.toFixed(2)}` : "—"}</strong></span>
                </div>
                {row.trendsValue != null && (
                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(row.trendsValue, 100)}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Full table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between">
              <span className="text-sm font-semibold text-slate-700">{filteredRows.length} hashtags</span>
              <button type="button" onClick={() => {
                const csv = ["hashtag,keyword,platform,volume,cpc,difficulty,trends"].concat(filteredRows.map((r) => `"${r.hashtag}","${r.keyword}","${r.platform}",${r.volume ?? ""},${r.cpc ?? ""},${r.difficulty ?? ""},${r.trendsValue ?? ""}`)).join("\n");
                const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "hashtags.csv"; a.click();
              }} className="text-xs text-[#f15b27] hover:underline">Export CSV</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                    <th className="px-4 py-3 w-8"><input type="checkbox" checked={selected.size === filteredRows.length && filteredRows.length > 0} onChange={toggleAll} className="rounded" /></th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Hashtag</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Platform</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Volume</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">CPC</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Difficulty</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Trends</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={`${row.hashtag}-${row.platform}`} onClick={() => toggleRow(row.hashtag)}
                      className={`border-b border-slate-50 cursor-pointer hover:bg-slate-50 ${selected.has(row.hashtag) ? "bg-orange-50" : ""}`}>
                      <td className="px-4 py-2.5"><input type="checkbox" checked={selected.has(row.hashtag)} onChange={() => toggleRow(row.hashtag)} onClick={(e) => e.stopPropagation()} className="rounded" /></td>
                      <td className="px-4 py-2.5 font-black text-slate-900">{row.hashtag}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${PLATFORM_COLORS[row.platform] ?? "bg-slate-100 text-slate-600"}`}>{row.platform}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{row.volume != null ? formatNumber(row.volume) : "—"}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{row.cpc != null ? `$${row.cpc.toFixed(2)}` : "—"}</td>
                      <td className="px-4 py-2.5 text-right">
                        {row.difficulty != null
                          ? <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${diffColor(row.difficulty)}`}>{row.difficulty}</span>
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-400 text-xs">{row.trendsValue ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && !error && !data && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          Enter a topic above to discover hashtags and their performance metrics across platforms.
        </div>
      )}

      {showSave && (
        <SaveToListModal keywords={saveItems} onClose={() => setShowSave(false)} onSaved={() => { setShowSave(false); setSelected(new Set()); }} />
      )}
    </div>
  );
}
