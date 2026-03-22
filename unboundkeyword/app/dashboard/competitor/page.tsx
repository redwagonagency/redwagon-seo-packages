"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn, formatNumber, difficultyColor } from "@/lib/utils";

interface GapKeyword {
  keyword: string;
  volume?: number;
  difficulty?: number;
  cpc?: number;
  domain1Rank?: number;
  domain2Rank?: number;
}

export default function CompetitorPage() {
  const [domain1, setDomain1] = useState("");
  const [domain2, setDomain2] = useState("");
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<GapKeyword[]>([]);
  const [error, setError] = useState("");

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setKeywords([]);
    try {
      const res = await fetch("/api/keywords/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "gap", domain1, domain2 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gap analysis failed");
      setKeywords(data.keywords || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Competitor Gap Analysis</h1>
        <p className="text-slate-500 text-sm">
          Find keywords your competitor ranks for that your domain is missing
        </p>
      </div>

      <form onSubmit={run} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8 max-w-xl">
        <div className="flex flex-col gap-4">
          <Input
            label="Your domain"
            placeholder="yourdomain.com"
            value={domain1}
            onChange={(e) => setDomain1(e.target.value)}
            required
          />
          <Input
            label="Competitor domain"
            placeholder="competitor.com"
            value={domain2}
            onChange={(e) => setDomain2(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Analysing…" : "Find keyword gaps"}
          </Button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-3 animate-pulse">⚔️</div>
          <p>Analysing competitor keywords…</p>
        </div>
      )}

      {keywords.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
            <span className="text-sm font-semibold text-slate-700">
              {keywords.length} keyword gaps found — {domain2} ranks, {domain1} doesn't
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Keyword</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600">Volume</th>
                <th className="px-5 py-3 text-center font-semibold text-slate-600">KD</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600">CPC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {keywords.map((kw, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-2.5 text-slate-800 font-medium">{kw.keyword}</td>
                  <td className="px-5 py-2.5 text-right text-slate-500">
                    {kw.volume != null ? formatNumber(kw.volume) : "—"}
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    {kw.difficulty != null ? (
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded", difficultyColor(kw.difficulty))}>
                        {kw.difficulty}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-2.5 text-right text-slate-500">
                    {kw.cpc != null ? `$${kw.cpc.toFixed(2)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
