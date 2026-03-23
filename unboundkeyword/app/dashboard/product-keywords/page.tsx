"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/utils";
import SaveToListModal, { type KWToSave } from "@/components/dashboard/SaveToListModal";
import type { ProductKeywordRow } from "@/app/api/product-keywords/route";

const INTENT_COLORS: Record<string, string> = {
  informational: "bg-blue-100 text-blue-700",
  commercial: "bg-amber-100 text-amber-700",
  transactional: "bg-green-100 text-green-700",
  navigational: "bg-slate-100 text-slate-600",
};

const SORT_OPTIONS = [
  { value: "volume", label: "Search Volume" },
  { value: "cpc", label: "CPC (High→Low)" },
  { value: "ecommerce", label: "E-commerce Signal First" },
];

export default function ProductKeywordsPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<ProductKeywordRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [filterText, setFilterText] = useState("");
  const [excludeText, setExcludeText] = useState("");
  const [ecommerceOnly, setEcommerceOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"volume" | "cpc" | "ecommerce">("volume");

  async function runSearch(kw?: string) {
    const keyword = (kw ?? query).trim();
    if (!keyword) return;
    setLoading(true);
    setError("");
    setSelected(new Set());
    try {
      const res = await fetch("/api/product-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });
      const data = (await res.json()) as { error?: string; results?: ProductKeywordRow[] };
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setResults(data.results ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = results
    .filter((r) => {
      if (filterText && !r.keyword.toLowerCase().includes(filterText.toLowerCase())) return false;
      if (excludeText && r.keyword.toLowerCase().includes(excludeText.toLowerCase())) return false;
      if (ecommerceOnly && !r.ecommerceSignal) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "cpc") return (b.cpc ?? 0) - (a.cpc ?? 0);
      if (sortBy === "ecommerce") {
        if (a.ecommerceSignal !== b.ecommerceSignal) return a.ecommerceSignal ? -1 : 1;
        return (b.volume ?? 0) - (a.volume ?? 0);
      }
      return (b.volume ?? 0) - (a.volume ?? 0);
    });

  const allChecked = filtered.length > 0 && filtered.every((r) => selected.has(r.keyword));

  function toggleAll() {
    if (allChecked) {
      setSelected((prev) => { const next = new Set(prev); filtered.forEach((r) => next.delete(r.keyword)); return next; });
    } else {
      setSelected((prev) => { const next = new Set(prev); filtered.forEach((r) => next.add(r.keyword)); return next; });
    }
  }

  function toggleRow(kw: string) {
    setSelected((prev) => { const next = new Set(prev); next.has(kw) ? next.delete(kw) : next.add(kw); return next; });
  }

  const selectedKws: KWToSave[] = results
    .filter((r) => selected.has(r.keyword))
    .map((r) => ({ keyword: r.keyword, volume: r.volume ?? 0, cpc: r.cpc ?? undefined }));

  return (
    <div className="p-8 max-w-7xl">
      <h1 className="text-4xl font-black text-slate-900 mb-1">Product Keywords</h1>
      <p className="text-sm text-slate-500 mb-6">E-commerce keyword research with buying-intent signals, volume and CPC data.</p>

      <div className="flex gap-2 mb-4">
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void runSearch()}
          placeholder="Enter a product keyword (e.g. coffee maker, running shoes)…"
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#f15b27]" />
        <button type="button" onClick={() => void runSearch()} disabled={loading || !query.trim()}
          className="rounded-lg bg-[#f15b27] px-6 py-2.5 text-sm font-black text-white hover:bg-[#d94e1f] disabled:opacity-60">
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {results.length > 0 && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input value={filterText} onChange={(e) => setFilterText(e.target.value)}
              placeholder="Contains text…"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-[#f15b27] w-44" />
            <input value={excludeText} onChange={(e) => setExcludeText(e.target.value)}
              placeholder="Doesn't contain…"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-[#f15b27] w-44" />
            <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer select-none">
              <input type="checkbox" checked={ecommerceOnly} onChange={(e) => setEcommerceOnly(e.target.checked)}
                className="rounded border-slate-300 text-[#f15b27] focus:ring-[#f15b27]" />
              Buying intent only
            </label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-[#f15b27] ml-auto">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {selected.size > 0 && (
              <button type="button" onClick={() => setShowSaveModal(true)}
                className="rounded-lg bg-[#f15b27] px-4 py-1.5 text-sm font-black text-white hover:bg-[#d94e1f]">
                + Save {selected.size} to List
              </button>
            )}
            {savedMsg && <span className="text-xs text-emerald-600 font-semibold">{savedMsg}</span>}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                {filtered.length} keywords{filtered.length !== results.length ? ` (filtered from ${results.length})` : ""}
              </span>
              <button type="button" onClick={() => {
                const csv = ["keyword,volume,cpc,intent,ecommerce"].concat(
                  filtered.map((r) => `"${r.keyword}",${r.volume ?? 0},${r.cpc ?? ""},${r.intent ?? ""},${r.ecommerceSignal}`)
                ).join("\n");
                const a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
                a.download = "product-keywords.csv"; a.click();
              }} className="text-xs text-[#f15b27] hover:underline">Export CSV</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                    <th className="px-4 py-3 w-8">
                      <input type="checkbox" checked={allChecked} onChange={toggleAll}
                        className="rounded border-slate-300 text-[#f15b27] focus:ring-[#f15b27]" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Keyword</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Volume</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">CPC</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Intent</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Buy Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.keyword} onClick={() => toggleRow(row.keyword)}
                      className={`border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition ${selected.has(row.keyword) ? "bg-orange-50" : ""}`}>
                      <td className="px-4 py-2.5">
                        <input type="checkbox" checked={selected.has(row.keyword)}
                          onChange={() => toggleRow(row.keyword)} onClick={(e) => e.stopPropagation()}
                          className="rounded border-slate-300 text-[#f15b27] focus:ring-[#f15b27]" />
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{row.keyword}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                        {row.volume > 0 ? formatNumber(row.volume) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                        {row.cpc != null ? `$${row.cpc.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        {row.intent ? (
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${INTENT_COLORS[row.intent] ?? "bg-slate-100 text-slate-600"}`}>
                            {row.intent}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {row.ecommerceSignal ? (
                          <span title="Buying intent signal" className="text-base">🛍️</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">No keywords match filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
          <div className="text-5xl mb-3">🛍️</div>
          <p className="text-slate-700 font-bold text-base mb-1">Discover E-commerce Keywords</p>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Enter any product or category to find keywords with buying intent, search volume, and CPC data.
          </p>
        </div>
      )}

      {showSaveModal && (
        <SaveToListModal keywords={selectedKws} onClose={() => setShowSaveModal(false)}
          onSaved={(count) => { setSavedMsg(`✓ ${count} saved`); setSelected(new Set()); setTimeout(() => setSavedMsg(""), 4000); }} />
      )}
    </div>
  );
}
