"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn, formatNumber, difficultyColor, intentBadgeVariant } from "@/lib/utils";

type Mode = "overview" | "magic" | "gap";

interface Keyword {
  keyword: string;
  volume?: number;
  difficulty?: number;
  cpc?: number;
  intent?: string;
  competition?: number;
}

interface ResearchResult {
  keywords: Keyword[];
  mode: string;
}

export default function ResearchPage() {
  const [mode, setMode] = useState<Mode>("magic");
  const [keyword, setKeyword] = useState("");
  const [domain1, setDomain1] = useState("");
  const [domain2, setDomain2] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState("");

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const body: Record<string, string> = { mode };
      if (mode === "gap") {
        body.domain1 = domain1;
        body.domain2 = domain2;
      } else {
        body.keyword = keyword;
      }
      const res = await fetch("/api/keywords/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Research failed");
      setResult({ keywords: data.keywords || [], mode });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Keyword Research</h1>
        <p className="text-slate-500 text-sm">Overview, magic tool, and keyword gap analysis</p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-6">
        {(["overview", "magic", "gap"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition capitalize",
              mode === m ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <form onSubmit={run} className="flex flex-col gap-3 max-w-xl mb-8">
        {mode === "gap" ? (
          <>
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
          </>
        ) : (
          <Input
            label={mode === "overview" ? "Keyword" : "Seed keyword"}
            placeholder={mode === "overview" ? "e.g. content marketing" : "e.g. coffee maker"}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            required
          />
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Researching…" : "Run research"}
        </Button>
      </form>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {result && result.keywords.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              {result.keywords.length} keywords
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Keyword</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600">Volume</th>
                <th className="px-5 py-3 text-center font-semibold text-slate-600">KD</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600">CPC</th>
                <th className="px-5 py-3 text-center font-semibold text-slate-600">Intent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {result.keywords.map((kw, i) => (
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
                  <td className="px-5 py-2.5 text-center">
                    {kw.intent ? (
                      <Badge variant={intentBadgeVariant(kw.intent)}>
                        {kw.intent}
                      </Badge>
                    ) : "—"}
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
