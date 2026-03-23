"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Priority = "High" | "Medium" | "Low";

type DecisionBundle = {
  generatedAt: string;
  input: { keyword: string; domain: string };
  opportunity: {
    opportunityScore: number;
    estimatedTrafficPotential: number;
    monetizationPotential: number;
    aiOverviewLikelihood: number;
    difficultyRewardRatio: number;
    whyWorthPursuing: string;
    priority: Priority;
    block: { insight: string; recommendation: string; action: string };
  };
  action: {
    blogTitleIdeas: string[];
    contentOutline: { h1: string; h2: string[]; h3: string[] };
    keyTalkingPoints: string[];
    faqSchemaSuggestions: string[];
    internalLinkSuggestions: string[];
    suggestedCta: string;
    block: { insight: string; recommendation: string; action: string };
  };
  aeo: {
    aiOverviewLikelihood: number;
    snippetReadyAnswers: string[];
    structuredFormatting: string[];
    schemaTypes: string[];
    winPlan: string;
    block: { insight: string; recommendation: string; action: string };
  };
  competitorGap: {
    fastWinGaps: Array<{
      keyword: string;
      volume: number;
      competitorDomain: string;
      yourPosition: number | null;
      competitorPosition: number | null;
      priority: Priority;
      nextAction: string;
    }>;
    weakContentAreas: string[];
    block: { insight: string; recommendation: string; action: string };
  };
  dailyFeed: Array<{
    title: string;
    impactScore: number;
    priority: Priority;
    whatChanged: string;
    whyItMatters: string;
    whatYouShouldDo: string;
  }>;
};

function Badge({ priority }: { priority: Priority }) {
  const classes =
    priority === "High"
      ? "bg-red-100 text-red-700"
      : priority === "Medium"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-700";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>{priority}</span>;
}

function scoreColor(score: number): string {
  if (score >= 75) return "text-emerald-600";
  if (score >= 45) return "text-amber-600";
  return "text-rose-600";
}

export default function DecisionEngineClient() {
  const [keyword, setKeyword] = useState("best local seo service");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<DecisionBundle | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  const topGap = useMemo(() => bundle?.competitorGap.fastWinGaps[0] ?? null, [bundle]);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    setPushStatus(null);

    try {
      const res = await fetch("/api/decision-engine/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, domain }),
      });

      const data = (await res.json()) as { error?: string; runId?: string; bundle?: DecisionBundle };
      if (!res.ok || !data.bundle) {
        throw new Error(data.error || "Failed to analyze");
      }

      setRunId(data.runId ?? null);
      setBundle(data.bundle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run analysis");
    } finally {
      setLoading(false);
    }
  }

  async function exportJson() {
    try {
      const res = await fetch(`/api/decision-engine/export${runId ? `?runId=${encodeURIComponent(runId)}` : ""}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Export failed");

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `decision-engine-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to export JSON");
    }
  }

  async function pushToCms() {
    if (!bundle) return;
    setPushStatus("Pushing...");

    try {
      const res = await fetch("/api/decision-engine/push-cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, payload: bundle }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message || "Push failed");
      setPushStatus(data.message || "Pushed successfully");
    } catch (err) {
      setPushStatus(err instanceof Error ? err.message : "Push failed");
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Content Map CTA */}
      <div className="flex items-center justify-between rounded-2xl border border-[#f15b27]/20 bg-[#fff8f5] px-5 py-3">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#f15b27]">New</span>
          <span className="ml-2 text-sm font-bold text-slate-800">AI Content Map</span>
          <span className="ml-2 text-xs text-slate-500">— analyse up to 30 keywords at once and get a full prioritised content strategy</span>
        </div>
        <Link href="/dashboard/decision-engine/content-map" className="shrink-0 text-xs font-black text-white bg-[#f15b27] rounded-lg px-3 py-1.5 hover:bg-[#d94e20] transition">
          Open Content Map →
        </Link>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Primary Keyword</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-[#f15b27] focus:ring-2"
              placeholder="best local seo service"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Domain (optional)</label>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-[#f15b27] focus:ring-2"
              placeholder="example.com"
            />
          </div>
          <button
            onClick={runAnalysis}
            disabled={loading || !keyword.trim()}
            className="rounded-lg bg-[#f15b27] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#d74d1f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Analyzing..." : "Run Decision Engine"}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </div>

      {bundle ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Opportunity Engine</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">{bundle.input.keyword}</h2>
                </div>
                <Badge priority={bundle.opportunity.priority} />
              </div>
              <p className={`mt-3 text-4xl font-black ${scoreColor(bundle.opportunity.opportunityScore)}`}>
                {bundle.opportunity.opportunityScore}
                <span className="text-base font-semibold text-slate-500">/100</span>
              </p>
              <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                <p>Traffic potential: <strong>{bundle.opportunity.estimatedTrafficPotential.toLocaleString()}/mo</strong></p>
                <p>Monetization potential: <strong>${bundle.opportunity.monetizationPotential.toLocaleString()}/mo</strong></p>
                <p>AI overview likelihood: <strong>{bundle.opportunity.aiOverviewLikelihood}%</strong></p>
                <p>Difficulty/Reward: <strong>{bundle.opportunity.difficultyRewardRatio}</strong></p>
              </div>
              <p className="mt-4 text-sm text-slate-600">{bundle.opportunity.whyWorthPursuing}</p>
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                <p><strong>Insight:</strong> {bundle.opportunity.block.insight}</p>
                <p><strong>Recommendation:</strong> {bundle.opportunity.block.recommendation}</p>
                <p><strong>Action:</strong> {bundle.opportunity.block.action}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">One-Click Execution</p>
              <div className="mt-4 space-y-2">
                <button onClick={exportJson} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Export Action Plan JSON
                </button>
                <button onClick={pushToCms} className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black">
                  Push Plan to CMS
                </button>
              </div>
              {pushStatus ? <p className="mt-3 text-xs text-slate-600">{pushStatus}</p> : null}
              {topGap ? (
                <div className="mt-5 rounded-lg bg-[#fff3ee] p-3 text-sm text-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#f15b27]">Fastest Win</p>
                  <p className="mt-1 font-semibold">{topGap.keyword}</p>
                  <p className="text-xs text-slate-600">{topGap.nextAction}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Action Engine</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {bundle.action.blogTitleIdeas.slice(0, 3).map((title) => (
                  <li key={title} className="rounded-lg bg-slate-50 p-2">{title}</li>
                ))}
              </ul>
              <div className="mt-4 text-sm text-slate-700">
                <p className="font-semibold">Suggested CTA</p>
                <p>{bundle.action.suggestedCta}</p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">AI Overview Optimizer</h3>
              <p className="mt-2 text-sm text-slate-700">AEO likelihood: <strong>{bundle.aeo.aiOverviewLikelihood}%</strong></p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {bundle.aeo.structuredFormatting.slice(0, 3).map((line) => (
                  <li key={line} className="rounded-lg bg-slate-50 p-2">{line}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-slate-700"><strong>Win plan:</strong> {bundle.aeo.winPlan}</p>
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Competitor Gap Engine</h3>
              <div className="mt-3 space-y-2">
                {bundle.competitorGap.fastWinGaps.slice(0, 5).map((gap) => (
                  <div key={`${gap.keyword}-${gap.competitorDomain}`} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">{gap.keyword}</p>
                      <Badge priority={gap.priority} />
                    </div>
                    <p className="text-xs text-slate-600">{gap.competitorDomain} #{gap.competitorPosition ?? "-"} | You #{gap.yourPosition ?? "-"} | Vol {gap.volume.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-slate-700">{gap.nextAction}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Daily Intelligence Feed</h3>
              <div className="mt-3 space-y-2">
                {bundle.dailyFeed.slice(0, 5).map((item) => (
                  <div key={item.title} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <Badge priority={item.priority} />
                    </div>
                    <p className="text-xs text-slate-600">Impact score: {item.impactScore}</p>
                    <p className="mt-1 text-xs text-slate-700">{item.whatYouShouldDo}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Run the Decision Engine to generate prioritized opportunities, execution steps, and your daily feed.
        </div>
      )}
    </div>
  );
}
