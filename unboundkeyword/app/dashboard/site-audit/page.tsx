"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { LighthouseLiveResult } from "@/lib/dataforseo/client";

function ScoreDial({ label, value }: { label: string; value: number | null }) {
  const pct = value !== null ? Math.round(value) : null;
  const color =
    pct === null ? "#94a3b8" : pct >= 90 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex h-24 w-24 items-center justify-center rounded-full border-4 text-2xl font-black"
        style={{ borderColor: color, color }}
      >
        {pct !== null ? pct : "—"}
      </div>
      <span className="text-xs font-semibold text-slate-500 text-center leading-tight">{label}</span>
    </div>
  );
}

const IMPACT_COLOR: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-slate-300",
};

export default function SiteAuditPage() {
  const [projectDomain, setProjectDomain] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LighthouseLiveResult | null>(null);
  const [error, setError] = useState("");
  const [hasProject, setHasProject] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/sites", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { sites: { id: string; domain: string }[]; selectedSiteId: string | null }) => {
        const selected = json.sites.find((s) => s.id === json.selectedSiteId);
        if (selected) {
          setProjectDomain(selected.domain);
          setHasProject(true);
        } else {
          setHasProject(false);
        }
      })
      .catch(() => setHasProject(false));
  }, []);

  async function runAudit() {
    if (!projectDomain) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const cleanUrl = projectDomain.startsWith("http") ? projectDomain : `https://${projectDomain}`;
      const res = await fetch("/api/site-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl, forMobile: mobile }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error((json as { error?: string }).error || "Audit failed");
      setData(json as LighthouseLiveResult);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Audit failed");
    } finally {
      setLoading(false);
    }
  }

  const scores = data
    ? [
        { label: "Performance", value: data.performance },
        { label: "Accessibility", value: data.accessibility },
        { label: "Best Practices", value: data.bestPractices },
        { label: "SEO", value: data.seo },
      ]
    : [];

  const overallScore =
    data && scores.every((s) => s.value !== null)
      ? Math.round(scores.reduce((sum, s) => sum + (s.value ?? 0), 0) / scores.length)
      : null;

  return (
    <div className="p-8 max-w-4xl">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 mb-6">
        <div className="text-xs uppercase tracking-[0.16em] text-[#f15b27] font-black mb-1">Site Audit</div>
        <h1 className="text-3xl font-black text-slate-900">Site Audit</h1>
        <p className="text-sm text-slate-600 mt-1">
          Performance, accessibility, best practices and SEO scores for your active project domain.
        </p>
      </div>

      {hasProject === null && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 flex items-center justify-center text-slate-400 text-sm">
          Loading project…
        </div>
      )}

      {hasProject === false && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
          <p className="text-slate-600 text-sm mb-3">No project domain selected.</p>
          <p className="text-slate-400 text-xs">Add a domain in the site switcher at the top of the sidebar, then return here to run your audit.</p>
        </div>
      )}

      {hasProject === true && projectDomain && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.12em] font-black text-slate-400 mb-0.5">Active Project</div>
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://www.google.com/s2/favicons?domain=${projectDomain}&sz=20`} alt="" width={20} height={20} className="rounded-sm" />
                <span className="text-lg font-black text-slate-900">{projectDomain}</span>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 whitespace-nowrap">
              <input type="checkbox" checked={mobile} onChange={(e) => setMobile(e.target.checked)} className="rounded border-slate-300" />
              Mobile audit
            </label>
            <Button onClick={runAudit} disabled={loading}>
              {loading ? "Auditing…" : data ? "Re-run Audit" : "Run Site Audit"}
            </Button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 flex flex-col items-center gap-3 text-slate-400">
          <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="font-semibold">Running site audit…</p>
          <p className="text-xs text-slate-300">Typically takes 15–30 seconds</p>
        </div>
      )}

      {data && !loading && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-slate-400 shrink-0">
              <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
              <path d="M10.172 13.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
            </svg>
            <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-700 hover:text-[#f15b27] truncate">{data.url}</a>
            {overallScore !== null && (
              <span className={`ml-auto text-xs font-black px-2.5 py-1 rounded-full ${overallScore >= 90 ? "bg-green-100 text-green-700" : overallScore >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                Overall {overallScore}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 px-6 py-8 border-b border-slate-100">
            {scores.map((s) => <ScoreDial key={s.label} label={s.label} value={s.value} />)}
          </div>

          {data.failedAudits.length > 0 ? (
            <div className="px-6 py-5">
              <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-400 mb-4">Top Issues to Fix</h2>
              <div className="space-y-2">
                {data.failedAudits.map((audit) => (
                  <div key={audit.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${IMPACT_COLOR[audit.impact] ?? "bg-slate-300"}`} />
                    <span className="flex-1 text-sm text-slate-800">{audit.title}</span>
                    <span className={`text-xs font-black tabular-nums ${audit.score < 50 ? "text-red-600" : "text-amber-500"}`}>{audit.score}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-slate-400 text-sm">✓ No significant issues found — great job!</div>
          )}
        </div>
      )}
    </div>
  );
}
