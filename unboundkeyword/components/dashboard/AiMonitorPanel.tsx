"use client";

import { useState } from "react";
import type { AiMonitorResult, AiMonitorInsight } from "@/app/api/superadmin/ai-monitor/route";

const PRIORITY_STYLES: Record<AiMonitorInsight["priority"], string> = {
  high: "border-rose-200 bg-rose-50 text-rose-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-slate-200 bg-slate-50 text-slate-500",
};

const CATEGORY_ICON: Record<AiMonitorInsight["category"], string> = {
  errors: "⚠",
  usage: "📊",
  growth: "📈",
  performance: "⚡",
  churn: "🔔",
};

export default function AiMonitorPanel() {
  const [result, setResult] = useState<AiMonitorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/superadmin/ai-monitor", { method: "POST" });
      const data = (await res.json()) as AiMonitorResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#f15b27]/20 bg-[#fff8f5] p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-[#f15b27] font-black mb-0.5">AI Monitor</div>
          <h2 className="text-lg font-black text-slate-900">Platform Health &amp; Recommendations</h2>
          {result && (
            <p className="text-xs text-slate-500 mt-0.5">
              {result.summary} · Generated {new Date(result.generatedAt).toLocaleString()}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading}
          className="rounded-xl bg-[#f15b27] text-white text-sm font-black px-4 py-2.5 hover:bg-[#d94e20] transition disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Analysing…
            </span>
          ) : result ? "Re-run Analysis" : "Run AI Analysis →"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700 mb-4">{error}</div>
      )}

      {!result && !loading && (
        <p className="text-sm text-slate-500">
          Click <strong>Run AI Analysis</strong> to scan the last 7 days of platform data and surface improvement recommendations.
        </p>
      )}

      {result && result.insights.length === 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          ✓ No issues detected — platform looks healthy.
        </div>
      )}

      {result && result.insights.length > 0 && (
        <div className="space-y-3">
          {result.insights.map((insight, i) => (
            <div
              key={i}
              className={`rounded-xl border px-4 py-3 ${PRIORITY_STYLES[insight.priority]}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0 leading-none mt-0.5">{CATEGORY_ICON[insight.category]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-sm">{insight.title}</span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[insight.priority]}`}>
                      {insight.priority}
                    </span>
                  </div>
                  <p className="text-xs leading-5 opacity-80">{insight.body}</p>
                  <p className="text-xs font-semibold mt-1.5 opacity-90">→ {insight.action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
