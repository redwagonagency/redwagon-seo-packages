"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";

interface InsightLine {
  emoji: string;
  text: string;
}

const ROUTE_INSIGHTS: Record<string, InsightLine[]> = {
  "/dashboard": [
    { emoji: "🔍", text: "Use the discovery bar above to explore keywords across Google, YouTube, Amazon and more." },
    { emoji: "💡", text: "Start with your main product or service keyword — then branch out to questions and comparisons." },
    { emoji: "📈", text: "Low-volume question keywords often convert better than high-volume generic terms." },
  ],
  "/dashboard/keyword-overview": [
    { emoji: "📊", text: "KD (Keyword Difficulty) under 30 = easier wins. Over 60 = need strong domain authority." },
    { emoji: "💰", text: "High CPC keywords signal strong commercial intent — competitors are paying for these clicks." },
    { emoji: "🎯", text: "Check the 'Top Regions' section to find where your audience is most concentrated." },
  ],
  "/dashboard/discover": [
    { emoji: "🌀", text: "Click a group label in the wheel to select all keywords in that category at once." },
    { emoji: "❓", text: "Question keywords are gold — they signal informational intent and often trigger featured snippets." },
    { emoji: "🗺️", text: "Use 'Local Searches' to find geo-specific variations that national competitors miss." },
  ],
  "/dashboard/keyword-ideas": [
    { emoji: "📌", text: "Sort by Volume to prioritize reach. Sort by KD to find quick-win opportunities." },
    { emoji: "🔑", text: "Use 'contains' filter to find all variations of a specific phrase pattern." },
    { emoji: "✅", text: "Bulk-select and add keywords to a list so you can track them in Rank Tracking." },
  ],
  "/dashboard/product-keywords": [
    { emoji: "🛍️", text: "Product keywords with 'best', 'review', 'vs' have high buying intent — prioritize these." },
    { emoji: "💲", text: "High avg prices in results = high CPC category. Your content here can compete with paid ads." },
    { emoji: "📦", text: "Add product keywords to a list to track ranking changes over time." },
  ],
  "/dashboard/content-ideas": [
    { emoji: "✍️", text: "Transactional-intent keywords are best for product pages. Informational = blog content." },
    { emoji: "📈", text: "Trending keywords (↑) represent rising interest — publish now to capture early traffic." },
    { emoji: "🏆", text: "Compare your content against top-ranking pages to identify gaps and improvements." },
  ],
  "/dashboard/seo-toolkit": [
    { emoji: "🔬", text: "Use Domain mode to analyze any competitor's backlink profile and domain authority." },
    { emoji: "📊", text: "Use Keyword mode for a full metric breakdown: volume, CPC, difficulty, SERP features." },
    { emoji: "🌐", text: "Page mode audits a specific URL — great for checking on-page SEO before publishing." },
  ],
  "/dashboard/competitor": [
    { emoji: "⚔️", text: "Gap keywords are ranking for your competitors but NOT for you — these are your biggest opportunities." },
    { emoji: "🥊", text: "Focus on competitors with similar Domain Rank to yours — achievable targets for keyword conquest." },
    { emoji: "📊", text: "Top pages reveals which content drives the most competitor traffic — mirror the topic, beat the content." },
  ],
  "/dashboard/traffic": [
    { emoji: "📡", text: "Compare your organic traffic trend against competitors to identify where you're losing ground." },
    { emoji: "🎯", text: "Domain rank correlates strongly with organic traffic — improving it lifts all your keywords." },
    { emoji: "🔍", text: "Look for competitors with lower Domain Rank but higher traffic — they have strong content strategy." },
  ],
  "/dashboard/local-keywords": [
    { emoji: "📍", text: "Local keywords with 'near me' have very high conversion intent — prioritize for local businesses." },
    { emoji: "🏙️", text: "DMA targeting lets you dominate in specific metro areas before going national." },
    { emoji: "⭐", text: "Local keywords often have lower competition than national terms — easier rankings." },
  ],
  "/dashboard/lists": [
    { emoji: "📋", text: "Organize keywords by topic or campaign. Add them to rank tracking to monitor position changes." },
    { emoji: "📤", text: "Export lists as CSV to import into Google Ads or other campaign management tools." },
    { emoji: "🗂️", text: "Create separate lists for each stage of the funnel: awareness, consideration, conversion." },
  ],
  "/dashboard/site-audit": [
    { emoji: "🔧", text: "Fix crawl errors and broken links first — they actively harm your rankings." },
    { emoji: "⚡", text: "Core Web Vitals (LCP, CLS, FID) are Google ranking signals — prioritize page speed issues." },
    { emoji: "🔗", text: "Internal linking improvements are quick wins — distribute link equity to important pages." },
  ],
  "/dashboard/decision-engine": [
    { emoji: "🧠", text: "The Decision Engine analyzes your domain + seed keyword to find your highest-ROI next steps." },
    { emoji: "🎯", text: "Start with your top 3 business keywords for the most actionable recommendations." },
    { emoji: "📅", text: "Run weekly to get fresh competitor intelligence and trend-based opportunities." },
  ],
};

const DEFAULT_INSIGHTS: InsightLine[] = [
  { emoji: "🚀", text: "Consistency beats perfection — publish optimized content regularly for compounding SEO returns." },
  { emoji: "🔍", text: "Long-tail keywords have lower competition and often higher conversion rates than broad terms." },
  { emoji: "💡", text: "Pro tip: analyze your top-converting pages and find more keywords for those topics." },
];

export default function JoeInsights() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [currentInsight, setCurrentInsight] = useState(0);

  // Rotate insight every 8 seconds when open
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      setCurrentInsight((n) => (n + 1) % insights.length);
    }, 8000);
    return () => clearInterval(id);
  });

  const basePath = pathname ?? "/dashboard";
  const insights = ROUTE_INSIGHTS[basePath] ?? DEFAULT_INSIGHTS;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Insight card */}
      {open && (
        <div className="w-72 rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#f15b27] to-[#ff7a45] text-white">
            <Image src="/joe-headshot.png" alt="Joe" width={28} height={28} className="rounded-full object-cover ring-2 ring-white/30 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Joe&apos;s Insights</div>
              <div className="text-[12px] font-semibold truncate">
                {basePath === "/dashboard" ? "Dashboard Overview" :
                 basePath.split("/").pop()?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) ?? "Tips"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition shrink-0"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-4 py-4">
            {insights.map((insight, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 py-2 border-b border-slate-50 last:border-0 transition-opacity duration-300 ${
                  i === currentInsight ? "opacity-100" : "opacity-40"
                }`}
              >
                <span className="text-base shrink-0 mt-0.5">{insight.emoji}</span>
                <p className="text-[12px] text-slate-700 leading-relaxed">{insight.text}</p>
              </div>
            ))}
          </div>

          <div className="px-4 pb-3 flex items-center justify-between">
            <div className="flex gap-1">
              {insights.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentInsight(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentInsight ? "bg-[#f15b27]" : "bg-slate-200"}`}
                />
              ))}
            </div>
            <span className="text-[10px] text-slate-400">Scroll tips with dots above</span>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg bg-white border-2 border-[#f15b27] hover:scale-105 transition-transform"
        title="Joe's Insights"
      >
        <Image
          src="/joe-headshot.png"
          alt="Joe"
          width={52}
          height={52}
          className="rounded-full object-cover"
        />
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#f15b27] rounded-full flex items-center justify-center">
            <span className="text-[8px] text-white font-black">!</span>
          </span>
        )}
      </button>
    </div>
  );
}
