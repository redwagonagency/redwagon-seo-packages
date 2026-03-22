"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/utils";

type ProductRow = {
  keyword: string;
  volume: number;
  cpc: number | null;
  difficulty: number;
  intent: string | null;
};

function getProductVariants(keyword: string): string[] {
  const root = keyword.trim();
  if (!root) return [];
  return [
    `${root} price`,
    `best ${root}`,
    `${root} near me`,
    `${root} reviews`,
    `${root} online`,
    `${root} for sale`,
  ];
}

export default function ProductKeywordsPage() {
  const [query, setQuery] = useState("dog food");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<ProductRow[]>([]);

  async function runSearch(nextQuery?: string) {
    const keyword = (nextQuery ?? query).trim();
    if (!keyword) return;

    setLoading(true);
    setError("");
    try {
      const terms = getProductVariants(keyword);
      const allRows: ProductRow[] = [];

      for (const term of terms) {
        const res = await fetch("/api/keywords/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword: term, mode: "overview", location: 2840, language: "en" }),
        });
        const data = (await res.json()) as {
          error?: string;
          keywords?: Array<{ keyword: string; volume: number | null; cpc: number | null; difficulty: number | null; intent?: string | null }>;
        };

        if (!res.ok) throw new Error(data.error || "Search failed");

        allRows.push(
          ...(data.keywords ?? []).map((row) => ({
            keyword: row.keyword,
            volume: row.volume ?? 0,
            cpc: row.cpc ?? null,
            difficulty: row.difficulty ?? 40,
            intent: row.intent ?? null,
          }))
        );
      }

      const deduped = Array.from(new Map(allRows.map((row) => [row.keyword.toLowerCase(), row])).values())
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 100);

      setRows(deduped);
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
          placeholder="product keyword"
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

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h1 className="text-2xl font-black text-slate-900">Product Keywords</h1>
          <span className="text-sm font-semibold text-slate-500">{rows.length.toLocaleString()} results</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Keyword</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Volume</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">CPC</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Difficulty</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Intent</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">Search to load product-focused keyword opportunities.</td>
                </tr>
              ) : rows.map((row) => (
                <tr key={row.keyword} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{row.keyword}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatNumber(row.volume)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{row.cpc != null ? `$${row.cpc.toFixed(2)}` : "-"}</td>
                  <td className="px-4 py-2.5 text-center tabular-nums text-slate-700">{row.difficulty}</td>
                  <td className="px-4 py-2.5 text-center text-xs capitalize text-slate-600">{row.intent ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
