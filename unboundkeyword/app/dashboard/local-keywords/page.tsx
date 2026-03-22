"use client";

import { useMemo, useState } from "react";
import { formatNumber } from "@/lib/utils";
import SaveToListModal, { type KWToSave } from "@/components/dashboard/SaveToListModal";

type LocalRow = {
  location: string;
  locationType: "state" | "dma";
  localizedKeyword: string;
  volume: number;
  inVariant: { keyword: string; volume: number; cpc: number | null; difficulty: number | null };
  bareVariant: { keyword: string; volume: number; cpc: number | null; difficulty: number | null };
  cpc: number | null;
  difficulty: number | null;
};

type LocalKeywordApiResponse = {
  keyword: string;
  nationalVolume: number;
  rows: LocalRow[];
};

const STATE_OPTIONS = [
  "California", "Texas", "Florida", "New York", "Illinois",
  "Pennsylvania", "Ohio", "Georgia", "North Carolina", "Michigan",
  "Washington", "Arizona", "Colorado", "Massachusetts", "New Jersey",
];

const DMA_OPTIONS = [
  "New York", "Los Angeles", "Chicago", "Dallas-Fort Worth",
  "Atlanta", "Houston", "Miami", "Seattle",
];

function difficultyClass(val: number | null) {
  if (val === null) return "bg-slate-100 text-slate-500";
  if (val >= 70) return "bg-red-100 text-red-700";
  if (val >= 40) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function toggleMulti(current: string[], value: string) {
  return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
}

export default function LocalKeywordsPage() {
  const [keyword, setKeyword] = useState("");
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedDmas, setSelectedDmas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<LocalKeywordApiResponse | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  async function runSearch() {
    const kw = keyword.trim();
    if (!kw) { setError("Enter a keyword first"); return; }
    if (selectedStates.length === 0 && selectedDmas.length === 0) {
      setError("Select at least one state or DMA");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/local-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: kw, states: selectedStates, dmas: selectedDmas }),
      });
      const data = (await res.json()) as LocalKeywordApiResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || "Local keyword lookup failed");
      setResult(data);
      setSelected(new Set());
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Error fetching local keywords");
    } finally {
      setLoading(false);
    }
  }

  const rows = result?.rows ?? [];
  const totalVolume = useMemo(() => rows.reduce((s, r) => s + (r.volume || 0), 0), [rows]);
  const allChecked = rows.length > 0 && selected.size === rows.length;

  function toggleRow(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => `${r.location}:::${r.localizedKeyword}`)));
  }

  const selectedKws: KWToSave[] = rows
    .filter((r) => selected.has(`${r.location}:::${r.localizedKeyword}`))
    .map((r) => ({ keyword: r.localizedKeyword, volume: r.volume, difficulty: r.difficulty ?? undefined, cpc: r.cpc ?? undefined }));

  return (
    <div className="p-8 max-w-7xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-6">
        <h1 className="text-3xl font-black text-slate-900 mb-1">Local Keywords</h1>
        <p className="text-sm text-slate-500 mb-5">
          Enter a keyword, select target states or DMAs, and discover localized search demand.
        </p>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Keyword</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. digital marketing agency"
              onKeyDown={(e) => { if (e.key === "Enter") void runSearch(); }}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-[#f15b27]"
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1">States</div>
            <div className="flex flex-wrap gap-1.5">
              {STATE_OPTIONS.map((state) => (
                <button
                  key={state}
                  type="button"
                  onClick={() => setSelectedStates((prev) => toggleMulti(prev, state))}
                  className={`rounded-full border px-2 py-1 text-xs transition-colors ${
                    selectedStates.includes(state)
                      ? "border-[#f15b27] bg-[#fff3ee] text-[#f15b27] font-semibold"
                      : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1">DMA Markets</div>
            <div className="flex flex-wrap gap-1.5">
              {DMA_OPTIONS.map((dma) => (
                <button
                  key={dma}
                  type="button"
                  onClick={() => setSelectedDmas((prev) => toggleMulti(prev, dma))}
                  className={`rounded-full border px-2 py-1 text-xs transition-colors ${
                    selectedDmas.includes(dma)
                      ? "border-[#f15b27] bg-[#fff3ee] text-[#f15b27] font-semibold"
                      : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {dma}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void runSearch()}
            disabled={loading}
            className="self-end rounded-lg bg-[#f15b27] px-6 py-2.5 text-sm font-black text-white hover:bg-[#d94e1f] disabled:opacity-60"
          >
            {loading ? "Running..." : "Run"}
          </button>
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-1">Keyword</div>
          <div className="text-2xl font-black text-slate-900 truncate">{result?.keyword || "—"}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-1">National Volume</div>
          <div className="text-3xl font-black text-slate-900">{formatNumber(result?.nationalVolume ?? 0)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-1">Locations Analyzed</div>
          <div className="text-3xl font-black text-slate-900">{rows.length}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-1">Total Local Volume</div>
          <div className="text-3xl font-black text-slate-900">{formatNumber(totalVolume)}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">Localized Keyword Results</h2>
            <p className="text-xs text-slate-500 mt-0.5">Shows the best-performing localized variant per location.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => setShowSaveModal(true)}
                className="rounded-md bg-[#f15b27] px-4 py-1.5 text-xs font-black text-white hover:bg-[#d94e1f] transition"
              >
                + Save {selected.size} to List
              </button>
            )}
            {savedMsg && <span className="text-xs text-emerald-600 font-semibold">{savedMsg}</span>}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    className="rounded border-slate-300 text-[#f15b27] focus:ring-[#f15b27]"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Location</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Best Keyword</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Volume</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Alt. Variant Vol.</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">CPC</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">KD</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-400">
                    Select locations and a keyword above, then click Run.
                  </td>
                </tr>
              ) : rows.map((row) => {
                const rowKey = `${row.location}:::${row.localizedKeyword}`;
                const altVariant = row.localizedKeyword === row.inVariant.keyword
                  ? row.bareVariant
                  : row.inVariant;
                return (
                  <tr
                    key={rowKey}
                    onClick={() => toggleRow(rowKey)}
                    className={`border-b border-slate-100 cursor-pointer transition ${selected.has(rowKey) ? "bg-orange-50" : "hover:bg-slate-50"}`}
                  >
                    <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(rowKey)}
                        onChange={() => toggleRow(rowKey)}
                        className="rounded border-slate-300 text-[#f15b27] focus:ring-[#f15b27]"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <div className="font-semibold text-slate-800">{row.location}</div>
                      <div className="text-[11px] text-slate-400 uppercase tracking-wide">{row.locationType}</div>
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-800">{row.localizedKeyword}</td>
                    <td className="px-6 py-3 text-right tabular-nums font-semibold text-slate-900">{formatNumber(row.volume)}</td>
                    <td className="px-6 py-3 text-right tabular-nums text-slate-500">
                      <span className="text-xs text-slate-400">{altVariant.keyword}</span>
                      <span className="ml-1 text-slate-700">{formatNumber(altVariant.volume)}</span>
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums text-slate-700">
                      {row.cpc != null ? `$${row.cpc.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`inline-flex rounded px-2 py-0.5 text-xs font-bold ${difficultyClass(row.difficulty)}`}>
                        {row.difficulty ?? "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showSaveModal && (
        <SaveToListModal
          keywords={selectedKws}
          onClose={() => setShowSaveModal(false)}
          onSaved={(count) => {
            setSavedMsg(`✓ ${count} keyword${count !== 1 ? "s" : ""} saved`);
            setSelected(new Set());
            setTimeout(() => setSavedMsg(""), 4000);
          }}
        />
      )}
    </div>
  );
}
