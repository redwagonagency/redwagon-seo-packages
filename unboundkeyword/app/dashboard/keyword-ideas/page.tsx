"use client";

import { useEffect, useMemo, useState } from "react";
import { formatNumber } from "@/lib/utils";

type IdeaRow = {
  keyword: string;
  volume: number;
  cpc: number | null;
  paidDifficulty: number;
  seoDifficulty: number;
  intent: string | null;
};

function difficultyCell(value: number) {
  if (value >= 70) return "bg-red-100 text-red-700";
  if (value >= 40) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function KeywordIdeasPage() {
  const [query, setQuery] = useState("digital marketing");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<IdeaRow[]>([]);

  async function runSearch(nextQuery?: string) {
    const keyword = (nextQuery ?? query).trim();
    if (!keyword) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/keywords/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, mode: "magic", location: 2840, language: "en" }),
      });
      const data = (await res.json()) as {
        error?: string;
        keywords?: Array<{ keyword: string; volume: number | null; cpc: number | null; difficulty: number | null; intent?: string | null }>;
      };
      if (!res.ok) throw new Error(data.error || "Search failed");

      const normalized = (data.keywords ?? []).map((row) => ({
        keyword: row.keyword,
        volume: row.volume ?? 0,
        cpc: row.cpc ?? null,
        paidDifficulty: Math.max(1, Math.round(((row.difficulty ?? 45) / 100) * 80)),
        seoDifficulty: row.difficulty ?? 45,
        intent: row.intent ?? null,
      }));

      setRows(normalized.sort((a, b) => b.volume - a.volume).slice(0, 160));
      setQuery(keyword);
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void runSearch(); }, []);

  const totalIdeas = rows.length.toLocaleString();
  const selected = useMemo(() => rows[0] ?? null, [rows]);

  return (
    <div className="p-8 max-w-7xl">
      <div className="rounded-xl border border-[#f15b27] bg-[#fff3ee] p-2 flex gap-2 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="keyword"
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
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h1 className="text-2xl font-black text-slate-900">{totalIdeas} Keyword Ideas</h1>
            <button type="button" className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500">Filters</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Keyword</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Vol</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">CPC</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">PD</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">SD</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Intent</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">Search to load keyword ideas.</td>
                  </tr>
                ) : rows.map((row) => (
                  <tr key={row.keyword} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{row.keyword}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatNumber(row.volume)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{row.cpc != null ? `$${row.cpc.toFixed(2)}` : "-"}</td>
                    <td className="px-4 py-2.5 text-center tabular-nums text-slate-700">{row.paidDifficulty}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex rounded px-2 py-0.5 text-xs font-black ${difficultyCell(row.seoDifficulty)}`}>{row.seoDifficulty}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-xs text-slate-600 capitalize">{row.intent ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-3xl leading-tight font-black text-slate-900">Keyword Overview</h2>
            <p className="text-slate-500">{selected?.keyword ?? "Run a search"}</p>
          </div>
          <div className="px-5 py-4 border-b border-slate-100 text-sm text-slate-600">
            {selected ? (
              <>
                <span className="font-semibold text-[#f15b27]">Live metrics loaded.</span> Use these ideas to seed discovery, lists, and content workflows.
              </>
            ) : (
              "Search for a keyword to view live opportunity data."
            )}
          </div>
          <div className="p-5 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Volume</span><span className="font-semibold text-slate-800">{selected ? formatNumber(selected.volume) : "-"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">CPC</span><span className="font-semibold text-slate-800">{selected?.cpc != null ? `$${selected.cpc.toFixed(2)}` : "-"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">SEO Difficulty</span><span className="font-semibold text-slate-800">{selected?.seoDifficulty ?? "-"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Intent</span><span className="font-semibold text-slate-800 capitalize">{selected?.intent ?? "-"}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
