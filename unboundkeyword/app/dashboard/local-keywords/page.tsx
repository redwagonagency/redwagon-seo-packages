"use client";

import { useState, useMemo } from "react";
import { formatNumber } from "@/lib/utils";
import SaveToListModal, { type KWToSave } from "@/components/dashboard/SaveToListModal";
import { US_STATES, US_DMAS } from "@/lib/data/usa-geo";
import type { LocalKeywordRow, LocalKeywordsResponse } from "@/app/api/local-keywords/route";

function diffColor(v: number | null) {
  if (v === null) return "bg-slate-100 text-slate-500";
  if (v >= 70) return "bg-red-100 text-red-700";
  if (v >= 40) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function LocalKeywordsPage() {
  const [keyword, setKeyword] = useState("");
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedDmas, setSelectedDmas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<LocalKeywordsResponse | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showSave, setShowSave] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [dmaSearch, setDmaSearch] = useState("");

  const filteredStates = useMemo(() =>
    US_STATES.filter((s) => !stateSearch || s.name.toLowerCase().includes(stateSearch.toLowerCase())),
    [stateSearch]
  );

  const filteredDmas = useMemo(() =>
    US_DMAS.filter((d) => !dmaSearch || d.name.toLowerCase().includes(dmaSearch.toLowerCase()) || d.state.toLowerCase().includes(dmaSearch.toLowerCase())),
    [dmaSearch]
  );

  function toggleState(abbr: string) {
    setSelectedStates((prev) => prev.includes(abbr) ? prev.filter((s) => s !== abbr) : [...prev, abbr]);
  }

  function toggleDma(id: string) {
    setSelectedDmas((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);
  }

  async function runSearch() {
    if (!keyword.trim() || (selectedStates.length === 0 && selectedDmas.length === 0)) {
      setError("Please enter a keyword and select at least one state or DMA.");
      return;
    }
    setLoading(true);
    setError("");
    setSelected(new Set());
    try {
      const res = await fetch("/api/local-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), states: selectedStates, dmaIds: selectedDmas }),
      });
      const json = (await res.json()) as LocalKeywordsResponse & { error?: string };
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
    const all = data?.rows ?? [];
    setSelected(selected.size === all.length ? new Set() : new Set(all.map((r) => r.keyword)));
  }

  const saveItems: KWToSave[] = [...selected].map((kw) => {
    const r = data?.rows.find((row) => row.keyword === kw);
    return { keyword: kw, volume: r?.volume ?? 0, cpc: r?.cpc ?? undefined, difficulty: r?.difficulty ?? undefined };
  });

  const rows = data?.rows ?? [];

  return (
    <div className="p-8 max-w-7xl">
      <h1 className="text-4xl font-black text-slate-900 mb-1">Local Keywords</h1>
      <p className="text-sm text-slate-500 mb-6">
        Generate geo-targeted keyword variants for every city in a DMA. Select states and/or DMAs, enter your seed keyword, then search.
      </p>

      {/* Keyword input */}
      <div className="flex gap-2 mb-6">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void runSearch()}
          placeholder="e.g. marketing agency"
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#f15b27]"
        />
        <button type="button" onClick={() => void runSearch()} disabled={loading}
          className="rounded-lg bg-[#f15b27] px-6 py-2.5 text-sm font-black text-white hover:bg-[#d94e1f] disabled:opacity-60">
          {loading ? "Generating…" : "Generate Keywords"}
        </button>
      </div>

      {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}

      {/* Selection panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* States */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">States ({selectedStates.length} selected)</span>
            {selectedStates.length > 0 && (
              <button type="button" onClick={() => setSelectedStates([])} className="text-xs text-slate-400 hover:text-red-500">Clear</button>
            )}
          </div>
          <div className="px-4 py-2 border-b border-slate-100">
            <input value={stateSearch} onChange={(e) => setStateSearch(e.target.value)} placeholder="Search states…"
              className="w-full text-xs border border-slate-200 rounded px-3 py-1.5 outline-none focus:border-[#f15b27]" />
          </div>
          <div className="h-48 overflow-y-auto p-2 flex flex-wrap gap-1">
            {filteredStates.map((s) => (
              <button key={s.abbr} type="button" onClick={() => toggleState(s.abbr)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold border transition-colors ${selectedStates.includes(s.abbr) ? "bg-[#f15b27] text-white border-[#f15b27]" : "bg-white text-slate-600 border-slate-200 hover:border-[#f15b27]"}`}>
                {s.name} ({s.abbr})
              </button>
            ))}
          </div>
        </div>

        {/* DMAs */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">DMAs ({selectedDmas.length} selected)</span>
            {selectedDmas.length > 0 && (
              <button type="button" onClick={() => setSelectedDmas([])} className="text-xs text-slate-400 hover:text-red-500">Clear</button>
            )}
          </div>
          <div className="px-4 py-2 border-b border-slate-100">
            <input value={dmaSearch} onChange={(e) => setDmaSearch(e.target.value)} placeholder="Search DMAs…"
              className="w-full text-xs border border-slate-200 rounded px-3 py-1.5 outline-none focus:border-[#f15b27]" />
          </div>
          <div className="h-48 overflow-y-auto p-2 flex flex-wrap gap-1">
            {filteredDmas.map((d) => (
              <button key={d.id} type="button" onClick={() => toggleDma(d.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold border transition-colors ${selectedDmas.includes(d.id) ? "bg-[#f15b27] text-white border-[#f15b27]" : "bg-white text-slate-600 border-slate-200 hover:border-[#f15b27]"}`}>
                {d.name}, {d.state}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Example keywords help */}
      {selectedDmas.length > 0 && keyword && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <strong>Examples for "{keyword}":</strong>{" "}
          {US_DMAS.filter((d) => selectedDmas.includes(d.id)).slice(0, 1).flatMap((d) =>
            d.cities.slice(0, 2).map((city) => `"${keyword.toLowerCase()} in ${city.toLowerCase()}"`)
          ).join(" · ")}...
        </div>
      )}

      {/* Results */}
      {rows.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">{formatNumber(rows.length)} keyword variants</span>
            <div className="flex gap-3">
              {selected.size > 0 && (
                <button type="button" onClick={() => setShowSave(true)}
                  className="rounded-full px-3 py-1 text-xs font-semibold bg-emerald-600 text-white">
                  Add {selected.size} to List
                </button>
              )}
              <button type="button" onClick={() => {
                const csv = ["keyword,city,state,dma,volume,cpc,difficulty,competition"].concat(
                  rows.map((r) => `"${r.keyword}","${r.city}","${r.state}","${r.dmaName ?? ""}",${r.volume ?? ""},${r.cpc ?? ""},${r.difficulty ?? ""},${r.competition ?? ""}`)
                ).join("\n");
                const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "local-keywords.csv"; a.click();
              }} className="text-xs text-[#f15b27] hover:underline">Export CSV</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                  <th className="px-4 py-3 w-8"><input type="checkbox" checked={selected.size === rows.length && rows.length > 0} onChange={toggleAll} className="rounded" /></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Keyword</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">City</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">DMA</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Volume</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">CPC</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Difficulty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Competition</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.keyword} onClick={() => toggleRow(row.keyword)}
                    className={`border-b border-slate-50 cursor-pointer hover:bg-slate-50 ${selected.has(row.keyword) ? "bg-orange-50" : ""}`}>
                    <td className="px-4 py-2.5"><input type="checkbox" checked={selected.has(row.keyword)} onChange={() => toggleRow(row.keyword)} onClick={(e) => e.stopPropagation()} className="rounded" /></td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{row.keyword}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-500">{row.city}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">{row.dmaName ?? row.state}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{row.volume != null ? formatNumber(row.volume) : "—"}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{row.cpc != null ? `$${row.cpc.toFixed(2)}` : "—"}</td>
                    <td className="px-4 py-2.5 text-right">
                      {row.difficulty != null
                        ? <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${diffColor(row.difficulty)}`}>{row.difficulty}</span>
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{row.competition ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && rows.length === 0 && data && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">No keyword variants found for the selected areas.</div>
      )}

      {showSave && (
        <SaveToListModal keywords={saveItems} onClose={() => setShowSave(false)} onSaved={() => { setShowSave(false); setSelected(new Set()); }} />
      )}
    </div>
  );
}
