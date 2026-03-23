"use client";

import { useEffect, useMemo, useState } from "react";
import { formatNumber } from "@/lib/utils";
import SaveToListModal, { type KWToSave } from "@/components/dashboard/SaveToListModal";
import type { IdeaKeyword, DemographicsData } from "@/app/api/keyword-ideas/route";

type Source = "google" | "amazon" | "both";

function difficultyCell(value: number) {
  if (value >= 70) return "bg-red-100 text-red-700";
  if (value >= 40) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function DemographicsPanel({
  demo,
  keyword,
}: {
  demo: DemographicsData | null;
  keyword: string | null;
}) {
  if (!keyword) {
    return (
      <div className="p-5 text-sm text-slate-400 text-center">
        Run a search to see audience demographics.
      </div>
    );
  }
  if (!demo || (demo.male === null && demo.ageGroups.length === 0)) {
    return (
      <div className="p-5 text-sm text-slate-400 text-center">
        Demographics unavailable for this keyword.
      </div>
    );
  }

  const maxAge = Math.max(...demo.ageGroups.map((a) => a.index), 1);

  return (
    <div className="p-5 space-y-5 text-sm">
      {demo.male !== null && demo.female !== null && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Audience gender
          </p>
          <div className="flex rounded-lg overflow-hidden h-5 text-xs font-bold text-white">
            <div
              style={{ width: `${demo.male}%` }}
              className="bg-blue-500 flex items-center justify-center"
            >
              {demo.male >= 15 ? `M ${demo.male}%` : ""}
            </div>
            <div
              style={{ width: `${demo.female}%` }}
              className="bg-pink-400 flex items-center justify-center"
            >
              {demo.female >= 15 ? `F ${demo.female}%` : ""}
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Male {demo.male}%</span>
            <span>Female {demo.female}%</span>
          </div>
        </div>
      )}

      {demo.ageGroups.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Age distribution
          </p>
          <div className="space-y-1.5">
            {demo.ageGroups.map((ag) => (
              <div key={ag.label} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-14 shrink-0">{ag.label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-[#f15b27] h-2 rounded-full"
                    style={{ width: `${Math.round((ag.index / maxAge) * 100)}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums text-slate-600 w-8 text-right">
                  {ag.index}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Index: 100 = average. Above 100 = over-represented.
          </p>
        </div>
      )}
    </div>
  );
}

export default function KeywordIdeasPage() {
  const [query, setQuery] = useState("digital marketing");
  const [source, setSource] = useState<Source>("google");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<IdeaKeyword[]>([]);
  const [demographics, setDemographics] = useState<DemographicsData | null>(null);
  const [searchedQuery, setSearchedQuery] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  async function runSearch(nextQuery?: string, nextSource?: Source) {
    const keyword = (nextQuery ?? query).trim();
    const src = nextSource ?? source;
    if (!keyword) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/keyword-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, source: src, location: 2840, language: "en", limit: 100 }),
      });
      const data = (await res.json()) as {
        error?: string;
        keywords?: IdeaKeyword[];
        demographics?: DemographicsData | null;
      };
      if (!res.ok) throw new Error(data.error ?? "Search failed");

      setRows((data.keywords ?? []).sort((a, b) => b.volume - a.volume));
      setDemographics(data.demographics ?? null);
      setSearchedQuery(keyword);
      setSelected(new Set());
    } catch (e) {
      setRows([]);
      setDemographics(null);
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void runSearch(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const allChecked = rows.length > 0 && selected.size === rows.length;
  const showSource = source === "both";

  function toggleRow(keyword: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(keyword)) next.delete(keyword);
      else next.add(keyword);
      return next;
    });
  }

  function toggleAll() {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.keyword)));
  }

  function handleSourceChange(s: Source) {
    setSource(s);
    void runSearch(undefined, s);
  }

  const selectedKws: KWToSave[] = useMemo(
    () =>
      rows
        .filter((r) => selected.has(r.keyword))
        .map((r) => ({
          keyword: r.keyword,
          volume: r.volume,
          difficulty: r.difficulty ?? undefined,
          cpc: r.cpc ?? undefined,
          intent: r.intent ?? undefined,
        })),
    [rows, selected]
  );

  const googleCount = rows.filter((r) => r.source === "google").length;
  const amazonCount = rows.filter((r) => r.source === "amazon").length;

  return (
    <div className="p-8 max-w-7xl">
      <h1 className="text-2xl font-black text-slate-900 mb-4">Keyword Ideas</h1>

      {/* Source selector */}
      <div className="flex gap-2 mb-3">
        {(["google", "amazon", "both"] as Source[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleSourceChange(s)}
            disabled={loading}
            className={`rounded-full px-4 py-1 text-xs font-bold border transition disabled:opacity-50 ${
              source === s
                ? "bg-[#f15b27] text-white border-[#f15b27]"
                : "bg-white text-slate-600 border-slate-200 hover:border-[#f15b27] hover:text-[#f15b27]"
            }`}
          >
            {s === "google" ? "Google" : s === "amazon" ? "Amazon" : "Both"}
          </button>
        ))}
        {source === "both" && rows.length > 0 && (
          <span className="ml-2 text-xs text-slate-400 self-center">
            {googleCount} Google · {amazonCount} Amazon
          </span>
        )}
      </div>

      {/* Search bar */}
      <div className="rounded-xl border border-[#f15b27] bg-[#fff3ee] p-2 flex gap-2 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a seed keyword…"
          className="flex-1 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-500"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void runSearch();
            }
          }}
        />
        <button
          type="button"
          onClick={() => void runSearch()}
          disabled={loading || !query.trim()}
          className="rounded-md bg-[#f15b27] px-4 py-2 text-xs font-black text-white disabled:opacity-60"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        {/* Results table */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <span className="text-2xl font-black text-slate-900">
              {rows.length.toLocaleString()} Keyword Ideas
            </span>
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
              {savedMsg && (
                <span className="text-xs text-emerald-600 font-semibold">{savedMsg}</span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="rounded border-slate-300 text-[#f15b27] focus:ring-[#f15b27]"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Keyword
                  </th>
                  {showSource && (
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Source
                    </th>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vol
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    CPC
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Diff
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Intent
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={showSource ? 7 : 6}
                      className="px-4 py-10 text-center text-sm text-slate-400"
                    >
                      {loading ? "Loading…" : "Search to load keyword ideas."}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={`${row.source}:${row.keyword}`}
                      onClick={() => toggleRow(row.keyword)}
                      className={`border-b border-slate-100 cursor-pointer transition ${
                        selected.has(row.keyword) ? "bg-orange-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(row.keyword)}
                          onChange={() => toggleRow(row.keyword)}
                          className="rounded border-slate-300 text-[#f15b27] focus:ring-[#f15b27]"
                        />
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{row.keyword}</td>
                      {showSource && (
                        <td className="px-4 py-2.5 text-center">
                          <span
                            className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold ${
                              row.source === "google"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {row.source === "google" ? "Google" : "Amazon"}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                        {formatNumber(row.volume)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                        {row.cpc != null ? `$${row.cpc.toFixed(2)}` : "-"}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {row.difficulty != null ? (
                          <span
                            className={`inline-flex rounded px-2 py-0.5 text-xs font-black ${difficultyCell(row.difficulty)}`}
                          >
                            {row.difficulty}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center text-xs text-slate-600 capitalize">
                        {row.intent ?? "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel: demographics + summary */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-xl font-black text-slate-900">Audience Demographics</h2>
            <p className="text-slate-500 text-sm mt-0.5 truncate">
              {searchedQuery ?? "Run a search"}
            </p>
          </div>

          <DemographicsPanel demo={demographics} keyword={searchedQuery} />

          {rows.length > 0 && (
            <div className="px-5 py-4 border-t border-slate-100 space-y-2 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Summary
              </p>
              <div className="flex justify-between">
                <span className="text-slate-500">Total ideas</span>
                <span className="font-semibold text-slate-800">{rows.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Avg volume</span>
                <span className="font-semibold text-slate-800">
                  {formatNumber(
                    Math.round(rows.reduce((s, r) => s + r.volume, 0) / rows.length)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">High difficulty (70+)</span>
                <span className="font-semibold text-red-600">
                  {rows.filter((r) => (r.difficulty ?? 0) >= 70).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Low difficulty (&lt;40)</span>
                <span className="font-semibold text-emerald-600">
                  {rows.filter((r) => r.difficulty !== null && r.difficulty < 40).length}
                </span>
              </div>
            </div>
          )}
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
