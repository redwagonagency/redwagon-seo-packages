"use client";

import Link from "next/link";

const FEATURES = [
  {
    icon: "🔍",
    title: "Keyword Discovery",
    description: "Turn any topic into thousands of real questions and phrases your audience searches for.",
    details: [
      "Questions, prepositions, comparisons, A-Z keywords",
      "Search volume by platform (Google, YouTube, Amazon, TikTok, etc.)",
      "Filter by intent, language, and location",
      "Export and save to custom lists",
    ],
  },
  {
    icon: "🎯",
    title: "A-Z Keywords",
    description: "Complete alphabetical breakdown of every keyword variation with real search data.",
    details: [
      "Every letter of the alphabet covered",
      "Live search volume metrics",
      "Sort by volume, difficulty, or CPC",
      "One-click list creation",
    ],
  },
  {
    icon: "📊",
    title: "Keyword Clusters",
    description: "Visualize keyword relationships with interactive wheels and detailed clustering.",
    details: [
      "Visual wheel representations",
      "Auto-grouped by intent and topic",
      "Drill-down capability for deeper insights",
      "Export clusters for content planning",
    ],
  },
  {
    icon: "📍",
    title: "Local Keywords",
    description: "Massive database of localized keywords across all US states, cities, and regions.",
    details: [
      "Keywords by state and city",
      "Local search volume trends",
      "Multi-location filtering",
      "Local intent detection",
    ],
  },
  {
    icon: "⚔️",
    title: "Competitor Gap Analysis",
    description: "See which keywords your competitors rank for that you don't.",
    details: [
      "Identify ranking gaps instantly",
      "Find quick-win opportunities",
      "Competitive landscape overview",
      "Keyword difficulty comparisons",
    ],
  },
  {
    icon: "📈",
    title: "Rank Tracking",
    description: "Monitor your keyword rankings across multiple platforms and locations.",
    details: [
      "Real-time ranking updates",
      "Multi-location tracking",
      "Historical trend data",
      "Alert notifications for changes",
    ],
  },
  {
    icon: "🧠",
    title: "Keyword Intent Detection",
    description: "Automatically categorized keywords by search intent.",
    details: [
      "Informational vs commercial vs transactional",
      "Intent-based filtering",
      "Content type recommendations",
      "Strategy recommendations",
    ],
  },
  {
    icon: "📋",
    title: "Keyword Lists",
    description: "Organize and manage keywords into custom named lists.",
    details: [
      "Unlimited list creation",
      "Bulk actions on lists",
      "Share with team members",
      "Export to CSV/Excel",
    ],
  },
  {
    icon: "🔗",
    title: "Integrations",
    description: "Connect your existing tools and workflow.",
    details: [
      "Google Search Console integration",
      "Google Analytics connection",
      "API access for automation",
      "CSV import/export",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <main className="ubk-bg min-h-screen text-white">
      {/* Header */}
      <nav className="relative z-30 flex items-center justify-between px-6 md:px-10 py-4 max-w-7xl mx-auto">
        <span className="text-lg font-black tracking-tight ubk-logo">
          Unbound<span className="text-white/50">Keyword</span>
        </span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-white/60 hover:text-white text-sm font-medium transition hidden sm:block">
            Sign in
          </Link>
          <Link href="/pricing" className="ubk-btn-primary text-sm font-bold px-5 py-2 rounded-full">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 py-20 max-w-6xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Everything keyword research <span className="ubk-orange-accent">needs</span>
        </h1>
        <p className="text-white/60 text-lg max-w-2xl mx-auto mb-12">
          Comprehensive keyword tools to discover, analyze, and track what your audience is searching for.
        </p>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="ubk-feature-card rounded-2xl p-7 flex flex-col gap-4 bg-slate-900/50 border border-white/[0.06] hover:border-[rgba(241,91,39,0.35)] transition"
            >
              <div className="text-4xl">{feature.icon}</div>
              <div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail, i) => (
                    <li key={i} className="text-xs text-white/45 flex items-start gap-2">
                      <span className="text-[#f97316] mt-1">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <div className="ubk-cta-banner rounded-3xl p-10 md:p-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Ready to explore keywords <span className="ubk-orange-accent">your competitors miss</span>?
          </h2>
          <p className="text-white/55 mb-8">No credit card required. Start discovering keywords today.</p>
          <Link href="/pricing" className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full inline-block">
            Get started for free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.07] py-8 text-center text-sm text-white/25">
        © 2026 UnBoundKeyword.com · All rights reserved ·{" "}
        <Link href="/privacy" className="hover:text-white/60 transition">Privacy</Link>
        {" · "}
        <Link href="/terms" className="hover:text-white/60 transition">Terms</Link>
      </footer>
    </main>
  );
}
