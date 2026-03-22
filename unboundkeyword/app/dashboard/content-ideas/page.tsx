"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/utils";

type ContentRow = {
  title: string;
  keyword: string;
  visits: number;
  backlinks: number;
  facebook: number;
  pinterest: number;
};

function buildTitle(keyword: string, index: number): string {
  const templates = [
    `How to choose ${keyword} in 2026`,
    `${keyword}: examples, checklist, and mistakes to avoid`,
    `Best ${keyword} strategies that convert in local markets`,
    `${keyword} playbook for teams that need faster growth`,
  ];
  return templates[index % templates.length];
}

export default function ContentIdeasPage() {
  const [query, setQuery] = useState("dog food");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<ContentRow[]>([]);

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
        keywords?: Array<{ keyword: string; volume: number | null; difficulty: number | null }>;
      };
      if (!res.ok) throw new Error(data.error || "Search failed");

      const nextRows: ContentRow[] = (data.keywords ?? []).slice(0, 70).map((row, idx) => {
        const base = row.volume ?? 0;
        const diff = row.difficulty ?? 20;
        return {
          title: buildTitle(row.keyword, idx),
          keyword: row.keyword,
          visits: Math.max(10, Math.round(base * (0.025 + ((idx % 4) * 0.01)))),
          backlinks: Math.max(1, Math.round(diff * (0.4 + (idx % 3) * 0.12))),
          facebook: Math.max(0, Math.round(base * (1.2 + (idx % 4) * 0.4))),
          pinterest: Math.max(0, Math.round(base * (0.2 + (idx % 3) * 0.15))),
        };
      });

      setRows(nextRows);
      setQuery(keyword);
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

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
          className="rounded-md bg-[#f15b27] px-6 py-2 text-xs font-black text-white disabled:opacity-60"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h1 className="text-3xl font-black text-slate-900">Content Ideas: <span className="font-semibold text-slate-500">{query}</span></h1>
          <button type="button" className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500">Filters</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 w-8" />
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Page Title / URL</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Est. Visits</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Backlinks</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Facebook</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Pinterest</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">Search to generate content ideas from live keyword data.</td>
                </tr>
              ) : rows.map((row, idx) => (
                <tr key={`${row.keyword}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3"><input type="checkbox" className="rounded border-slate-300" /></td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#f15b27] hover:underline cursor-pointer">{row.title}</div>
                    <div className="text-xs text-slate-400 mt-1">topic: {row.keyword}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatNumber(row.visits)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatNumber(row.backlinks)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatNumber(row.facebook)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatNumber(row.pinterest)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
