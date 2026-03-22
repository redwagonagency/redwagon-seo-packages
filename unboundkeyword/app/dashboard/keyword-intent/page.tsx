"use client";

import { useEffect, useMemo, useState } from "react";
import { formatNumber } from "@/lib/utils";

type IntentType = "informational" | "transactional" | "navigational" | "commercial";

type IntentRow = {
  keyword: string;
  intent: IntentType;
  volume: number;
  difficulty: number | null;
  cpc: number | null;
};

const INTENT_META: Record<IntentType, { label: string; description: string; color: string; border: string }> = {
  informational: {
    label: "Informational",
    description: "Learning intent: guides, definitions, and explanations.",
    color: "bg-blue-50 text-blue-700",
    border: "border-blue-200",
  },
  transactional: {
    label: "Transactional",
    description: "Action intent: ready to buy, sign up, or convert.",
    color: "bg-emerald-50 text-emerald-700",
    border: "border-emerald-200",
  },
  navigational: {
    label: "Navigational",
    description: "Brand intent: trying to reach a specific site/page.",
    color: "bg-violet-50 text-violet-700",
    border: "border-violet-200",
  },
  commercial: {
    label: "Commercial",
    description: "Research intent: comparison and evaluation before purchase.",
    color: "bg-amber-50 text-amber-700",
    border: "border-amber-200",
  },
};

function coerceIntent(raw: string | null | undefined): IntentType {
  const s = (raw ?? "").toLowerCase();
  if (s === "transactional" || s === "navigational" || s === "commercial") return s;
  return "informational";
}

export default function KeywordIntentPage() {
  const [query, setQuery] = useState("digital marketing");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<IntentRow[]>([]);

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
        keywords?: Array<{ keyword: string; volume: number | null; difficulty: number | null; cpc: number | null; intent?: string | null }>;
      };
      if (!res.ok) throw new Error(data.error || "Search failed");

      setRows(
        (data.keywords ?? []).map((r) => ({
          keyword: r.keyword,
          intent: coerceIntent(r.intent),
          volume: r.volume ?? 0,
          difficulty: r.difficulty ?? null,
          cpc: r.cpc ?? null,
        }))
      );
      setQuery(keyword);
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void runSearch(); }, []);

  const grouped = useMemo(
    () =>
      rows.reduce<Record<IntentType, IntentRow[]>>(
        (acc, row) => { acc[row.intent].push(row); return acc; },
        { informational: [], transactional: [], navigational: [], commercial: [] }
      ),
    [rows]
  );

  const totalKeywords = rows.length;

  return (
    <div className="p-8 max-w-7xl">
      <div className="rounded-xl border border-[#f15b27] bg-[#fff3ee] p-2 flex gap-2 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="seed keyword"
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
          {loading ? "Analyzing..." : "Analyze Intent"}
        </button>
      </div>

      {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-7">
        {(["informational", "transactional", "navigational", "commercial"] as IntentType[]).map((intent) => {
          const intentRows = grouped[intent];
          const volumeSum = intentRows.reduce((sum, row) => sum + row.volume, 0);
          const pct = totalKeywords ? Math.round((intentRows.length / totalKeywords) * 100) : 0;
          const meta = INTENT_META[intent];

          return (
            <div key={intent} className={`rounded-xl border ${meta.border} bg-white p-5`}>
              <div className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${meta.color}`}>{meta.label}</div>
              <div className="mt-3 text-4xl font-black text-slate-900">{intentRows.length}</div>
              <div className="text-xs text-slate-400 mt-1">{pct}% of results</div>
              <div className="mt-3 text-sm text-slate-600">{formatNumber(volumeSum)} total monthly volume</div>
              <p className="mt-2 text-xs text-slate-500">{meta.description}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Intent Breakdown Table</h2>
          <p className="text-xs text-slate-500 mt-0.5">{totalKeywords} keywords analyzed</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Keyword</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Intent</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Volume</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">CPC</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">KD</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400">
                    {loading ? "Loading keyword intent data..." : "Search to load keyword intent analysis."}
                  </td>
                </tr>
              ) : rows.slice(0, 200).map((row) => (
                <tr key={row.keyword} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800">{row.keyword}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${INTENT_META[row.intent].color}`}>
                      {INTENT_META[row.intent].label}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums text-slate-700">{formatNumber(row.volume)}</td>
                  <td className="px-6 py-3 text-right tabular-nums text-slate-700">{row.cpc != null ? `$${row.cpc.toFixed(2)}` : "—"}</td>
                  <td className="px-6 py-3 text-right tabular-nums text-slate-700">{row.difficulty ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
