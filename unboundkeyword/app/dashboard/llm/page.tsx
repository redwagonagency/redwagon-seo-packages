"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface LlmResult {
  keyword: string;
  mentionsCount?: number;
  rating?: number;
  urls?: string[];
  aiOverviewPresent?: boolean;
}

export default function LLMPage() {
  const [keywords, setKeywords] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LlmResult[]>([]);
  const [error, setError] = useState("");

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim()) return;
    const kws = keywords
      .split(/[\n,]+/)
      .map((k) => k.trim())
      .filter(Boolean);
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const res = await fetch("/api/keywords/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim(), keywords: kws }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "LLM check failed");
      setResults(data.results || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">LLM Visibility</h1>
        <p className="text-slate-500 text-sm">
          Check if your domain appears in AI-generated answers (ChatGPT, Perplexity, etc.) for your target keywords
        </p>
      </div>

      <form onSubmit={run} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8 max-w-xl">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Keywords (one per line or comma-separated)
            </label>
            <textarea
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={4}
              placeholder="best coffee makers&#10;pour over coffee&#10;espresso machine reviews"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              required
            />
          </div>
          <Input
            label="Your domain (required)"
            placeholder="yourdomain.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Checking AI visibility…" : "Check LLM visibility"}
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
          <div className="text-4xl mb-3 animate-pulse">🤖</div>
          <p>Checking AI visibility for {keywords.split(/[\n,]+/).filter(Boolean).length} keywords…</p>
          <p className="text-sm mt-1 text-slate-300">This may take a moment</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-4">
          {results.map((r, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{r.keyword}</h3>
                  {r.aiOverviewPresent && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
                      AI Overview triggered
                    </span>
                  )}
                </div>
                {r.rating != null && (
                  <div className={cn(
                    "text-sm font-bold px-3 py-1 rounded-lg",
                    r.rating >= 7 ? "bg-green-100 text-green-700" :
                    r.rating >= 4 ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  )}>
                    Score: {r.rating}/10
                  </div>
                )}
              </div>
              {r.mentionsCount != null && (
                <p className="text-sm text-slate-500 mb-2">
                  {domain
                    ? `"${domain}" mentioned ${r.mentionsCount} times in AI results`
                    : `${r.mentionsCount} AI mentions found`}
                </p>
              )}
              {r.urls && r.urls.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Top cited sources</p>
                  <ul className="flex flex-col gap-1">
                    {r.urls.slice(0, 5).map((url, j) => (
                      <li key={j} className="text-xs text-indigo-600 truncate">{url}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
