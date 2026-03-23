"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/utils";
import SaveToListModal, { type KWToSave } from "@/components/dashboard/SaveToListModal";
import type { IdeaKeyword, KeywordIdeasResponse } from "@/app/api/keyword-ideas/route";

type Source = "all" | "google" | "bing" | "amazon";

const SOURCE_COLORS: Record<string, string> = {
  google: "bg-blue-100 text-blue-700",
  google_ads: "bg-indigo-100 text-indigo-700",
  google_trends: "bg-purple-100 text-purple-700",
  bing: "bg-cyan-100 text-cyan-700",
  amazon: "bg-orange-100 text-orange-700",
  related: "bg-emerald-100 text-emerald-700",
};

function difficultyCell(v: number | null) {
  if (v === null) return "bg-slate-100 text-slate-500";
  if (v >= 70) return "bg-red-100 text-red-700";
  if (v >= 40) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function KeywordIdeasPage() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<Source>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<KeywordIdeasResponse | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showSave, setShowSave] = useState(false);

  async function runSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setSelected(new Set());
    try {
      const res = await fetch("/api/keyword-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: query.trim(), source, limit: 150 }),
      });
      const json = (await res.json()) as KeywordIdeasResponse & { error?: string };
      if (!res.ok) throw new Error(json.error || "Failed");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function toggleRow(kw: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(kw)) next.delete(kw); else next.add(kw);
      return next;
    });
  }

  function toggleAll() {
    const rows = data?.keywords ?? [];
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.keyword)));
  }

  const saveItems: KWToSave[] = [...selected].map((kw) => {
    const row = data?.keywords.find((r) => r.keyword === kw);
    return { keyword: kw, volume: row?.volume ?? 0, cpc: row?.cpc ?? undefined, difficulty: row?.difficulty ?? undefined };
  });

  const rows = data?.keywords ?? [];

  return (
    <div className="p-8 max-w-7xl">
      <h1 className="text-4xl font-black text-slate-900 mb-1">Keyword Ideas</h1>
      <p className="text-sm text-slate-500 mb-6">
        Multi-source suggestions from Google, Bing, Google Ads, Google Trends, and Amazon.
        {data?.siteName ? ` Site-specific results for ${data.siteName}.` : ""}
      </p>

      {/* Search bar */}
      <div className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void runSearch()}
          placeholder="Enter a seed keyword…"
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#f15b27]"
        />
        <button
          type="button"
          onClick={() => void runSearch()}
          disabled={loading}
          className="rounded-lg bg-[#f15b27] px-6 py-2.5 text-sm font-black text-white hover:bg-[#d94e1f] disabled:opacity-60"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {/* Source filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["all", "google", "bing", "amazon"] as Source[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSource(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition-colors ${source === s ? "bg-[#f15b27] text-white border-[#f15b27]" : "bg-white text-slate-600 border-slate-200 hover:border-[#f15b27]"}`}
          >
            {s === "all" ? "All Sources" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        {selected.size > 0 && (
          <button
            type="button"
            onClick={() => setShowSave(true)}
            className="ml-auto rounded-full px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white"
          >
            Add {selected.size} to List
          </button>
        )}
      </div>

      {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}

      {/* Google Trends mini-chart */}
      {(data?.trendsData ?? []).length > 0 && (
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Google Trends Interest</p>
          <div className="flex flex-wrap gap-2">
            {data!.trendsData.map((t) => (
              <div key={t.keyword} className="flex items-center gap-2 text-xs">
                <span className="text-slate-600 font-medium">{t.keyword}</span>
                <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.max(t.value, 4)}px` }} />
                <span className="text-slate-400">{t.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results table */}
      {rows.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">{formatNumber(rows.length)} keywords</span>
            <button type="button" onClick={() => {
              const csv = ["keyword,volume,bing_volume,cpc,difficulty,source", ...rows.map((r) => `"${r.keyword}",${r.volume},${r.bingVolume ?? ""},${r.cpc ?? ""},${r.difficulty ?? ""},${r.source}`)].join("\n");
              const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "keyword-ideas.csv"; a.click();
            }} className="text-xs text-[#f15b27] hover:underline">Export CSV</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                  <th className="px-4 py-3 text-left w-8">
                    <input type="checkbox" checked={selected.size === rows.length && rows.length > 0} onChange={toggleAll} className="rounded" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Keyword</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Volume</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Bing Vol</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">CPC</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Difficulty</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Trends</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Source</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.keyword} onClick={() => toggleRow(row.keyword)} className={`border-b border-slate-50 cursor-pointer hover:bg-slate-50 ${selected.has(row.keyword) ? "bg-orange-50" : ""}`}>
                    <td className="px-4 py-2.5">
                      <input type="checkbox" checked={selected.has(row.keyword)} onChange={() => toggleRow(row.keyword)} onClick={(e) => e.stopPropagation()} className="rounded" />
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{row.keyword}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{row.volume > 0 ? formatNumber(row.volume) : "—"}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-400 text-xs">{row.bingVolume != null ? formatNumber(row.bingVolume) : "—"}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{row.cpc != null ? `$${row.cpc.toFixed(2)}` : "—"}</td>
                    <td className="px-4 py-2.5 text-right">
                      {row.difficulty != null ? (
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${difficultyCell(row.difficulty)}`}>{row.difficulty}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-400 text-xs">{row.trendsValue != null ? row.trendsValue : "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${SOURCE_COLORS[row.source] ?? "bg-slate-100 text-slate-600"}`}>{row.source.replace("_", " ")}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && rows.length === 0 && query && data && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          No keywords found. Try a different seed term.
        </div>
      )}

      {showSave && (
        <SaveToListModal
          keywords={saveItems}
          onClose={() => setShowSave(false)}
          onSaved={() => { setShowSave(false); setSelected(new Set()); }}
        />
      )}
    </div>
  );
}
