"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { JoeInsightData } from "@/app/api/joe-insights/route";

function buildInsight(page: string, d: JoeInsightData): { headline: string; body: string } {
  const seed = d.lastSeedKeyword ? `"${d.lastSeedKeyword}"` : "your seed keyword";
  const lists = d.listCount;
  const kw = d.totalKeywordsInLists;
  const sessions = d.discoverySessionCount;
  const domain = d.domain ?? "your site";

  if (!d.hasData) {
    // First-run onboarding hints per page
    const onboarding: Record<string, { headline: string; body: string }> = {
      "/dashboard": {
        headline: "Start by entering a keyword above",
        body: "Type any product, service, or topic into the search bar to unlock keyword intelligence for your niche.",
      },
      "/dashboard/keyword-overview": {
        headline: "Look up any keyword for full metrics",
        body: "Enter a keyword to see monthly search volume, difficulty score, CPC value, and SERP features in one view.",
      },
      "/dashboard/discover": {
        headline: "Enter a seed keyword to spin the wheel",
        body: "The discovery wheel organizes related searches into groups — questions, comparisons, prepositions, and more.",
      },
      "/dashboard/keyword-ideas": {
        headline: "Run a discovery first to populate ideas",
        body: "After discovering keywords in the Keyword Discovery tool, ideas will flow into this view for deeper analysis.",
      },
      "/dashboard/content-ideas": {
        headline: "Discover keywords to unlock content angles",
        body: "Run keyword discovery to see which topics have editorial opportunity, trending potential, and low-competition gaps.",
      },
      "/dashboard/competitor": {
        headline: "Add competitor domains in your project settings",
        body: "Once you save competitor domains, this view will show you their top keywords, traffic sources, and content gaps.",
      },
      "/dashboard/traffic": {
        headline: "Connect GA4 or Search Console for live data",
        body: "Authorize your Google account on the Dashboard page to populate organic traffic and impression trends.",
      },
      "/dashboard/lists": {
        headline: "Discover keywords and save them to lists",
        body: "Run keyword discovery, select the ones that match your strategy, and add them to a named list to track over time.",
      },
      "/dashboard/local-keywords": {
        headline: "Research geo-specific keyword opportunities",
        body: "Enter a service + city combination to find local search queries that national competitors often overlook.",
      },
      "/dashboard/decision-engine": {
        headline: "Run your Decision Center for strategic priorities",
        body: "Enter your domain and top business keyword to get an AI-ranked action plan based on your competitive landscape.",
      },
    };
    return onboarding[page] ?? {
      headline: "Start researching to see insights here",
      body: "Use the tools on this page to build keyword intelligence for your niche. Joe will surface actionable tips as you go.",
    };
  }

  // Data-driven per-page copy
  switch (page) {
    case "/dashboard":
      return {
        headline: sessions > 0
          ? `You've run ${sessions} discovery session${sessions > 1 ? "s" : ""} — here's what's next`
          : "Your keyword workspace is ready",
        body: kw > 0
          ? `You have ${kw} keyword${kw > 1 ? "s" : ""} across ${lists} list${lists > 1 ? "s" : ""}. ${d.ga4Connected ? "GA4 is live — check Traffic Overview for organic trends." : "Connect GA4 to see your organic traffic alongside your keywords."}`
          : `Start adding keywords to lists so you can track them in Rank Tracking. ${d.ga4Connected ? "" : "Connect GA4 for traffic data."}`,
      };

    case "/dashboard/discover":
      return {
        headline: sessions > 0
          ? `Last discovery: ${seed} — ${sessions > 1 ? `${sessions} total sessions` : "1 session"}`
          : "Spin the wheel with any keyword",
        body: sessions > 0
          ? "Click any spoke label to select all keywords in that group. Use the orange filter bar to drill into questions, comparisons, or A–Z patterns."
          : "Type a product, service, or topic and hit Enter. The wheel will map hundreds of related search queries by type and intent.",
      };

    case "/dashboard/keyword-ideas":
      return {
        headline: kw > 0 ? `${kw} keywords saved — ready for deeper analysis` : "Browse and filter keyword ideas",
        body: "Sort by KD under 30 for quick-win opportunities. Sort by CPC above $5 for high-commercial-intent targets. Bulk-select and add to a list to track them.",
      };

    case "/dashboard/keyword-overview":
      return {
        headline: sessions > 0 ? `Recent research: ${seed}` : "Full metrics for any keyword",
        body: "Keyword Difficulty under 30 = easier to rank. Over 60 = you need strong authority. High CPC signals that advertisers pay for those clicks — strong commercial intent.",
      };

    case "/dashboard/content-ideas":
      return {
        headline: sessions > 0 ? `Content angles found for ${seed}` : "Map content to search intent",
        body: "Informational keywords → blog posts and guides. Transactional → product/service pages. Trending (↑) keywords are rising now — publish early to capture the curve.",
      };

    case "/dashboard/competitor":
      return {
        headline: d.competitorCount > 0
          ? `${d.competitorCount} competitor${d.competitorCount > 1 ? "s" : ""} tracked for ${domain}`
          : "Start competitor gap analysis",
        body: d.competitorCount > 0
          ? "Gap keywords rank for competitors but NOT for you — those are your highest-ROI opportunities. Focus on competitors with similar Domain Rank."
          : "Add competitor domains in your project settings. Then use the Keywords by Traffic view to find their top-ranking pages and keyword gaps you can close.",
      };

    case "/dashboard/traffic":
      return {
        headline: d.ga4Connected ? "GA4 connected — live traffic data active" : "Connect GA4 for traffic insights",
        body: d.ga4Connected
          ? "Compare your organic traffic trend against competitors. Domain rank correlates strongly with traffic — content and backlinks both move it."
          : "Click Connect on the Dashboard page to authorize GA4. Once connected, you'll see organic sessions, top landing pages, and channel breakdown.",
      };

    case "/dashboard/lists":
      return {
        headline: lists > 0
          ? `${lists} list${lists > 1 ? "s" : ""} · ${kw} total keyword${kw > 1 ? "s" : ""}`
          : "Organize keywords by strategy",
        body: lists > 0
          ? "Organize lists by funnel stage: awareness, consideration, conversion. Export as CSV to import into Google Ads or your CMS."
          : "After running discovery or keyword ideas, use the checkboxes to select keywords and add them to a named list for tracking.",
      };

    case "/dashboard/local-keywords":
      return {
        headline: "Local intent keywords convert at higher rates",
        body: `'Near me' and city-qualified keywords have significantly lower competition than national terms. Search "${d.lastSeedKeyword ? d.lastSeedKeyword + " [city]" : "service + city"}" to find geo-targeted opportunities.`,
      };

    case "/dashboard/site-audit":
      return {
        headline: `Auditing ${domain}`,
        body: "Fix crawl errors and broken links first — they directly harm rankings. Core Web Vitals (LCP, CLS) are Google ranking signals; prioritize page speed issues next.",
      };

    case "/dashboard/decision-engine":
      return {
        headline: sessions > 0
          ? `Decision intelligence ready for ${domain}`
          : "Get your highest-ROI keyword action plan",
        body: "Enter your domain and top business keyword. The Decision Engine analyzes your competitive gap and surfaces the 3 moves with the highest expected ROI.",
      };

    default:
      return {
        headline: kw > 0 ? `${kw} keywords tracked across ${lists} list${lists > 1 ? "s" : ""}` : "Research tip",
        body: sessions > 0
          ? `You've researched ${seed} and similar terms. Low-volume long-tail keywords often convert better than high-volume generics.`
          : "Consistency beats perfection — publish optimized content regularly for compounding SEO returns.",
      };
  }
}

export default function PageInsightCard() {
  const pathname = usePathname() ?? "/dashboard";
  const [data, setData] = useState<JoeInsightData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Re-check dismiss state per page
  useEffect(() => {
    const key = `joe-insight-dismissed:${pathname}`;
    setDismissed(sessionStorage.getItem(key) === "1");
  }, [pathname]);

  useEffect(() => {
    fetch("/api/joe-insights")
      .then((r) => r.json())
      .then((d) => setData(d as JoeInsightData))
      .catch(() => null);
  }, []);

  if (dismissed || !data) return null;

  const { headline, body } = buildInsight(pathname, data);

  function dismiss() {
    sessionStorage.setItem(`joe-insight-dismissed:${pathname}`, "1");
    setDismissed(true);
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#f15b27]/20 bg-[#fff8f5] px-4 py-3 mb-5">
      <Image
        src="/joe-headshot.png"
        alt="Joe"
        width={32}
        height={32}
        className="rounded-full object-cover ring-2 ring-[#f15b27]/30 shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#f15b27]">Joe&apos;s Insight</span>
        </div>
        <p className="text-[13px] font-bold text-slate-800 leading-snug">{headline}</p>
        <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{body}</p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="text-slate-300 hover:text-slate-500 transition shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
