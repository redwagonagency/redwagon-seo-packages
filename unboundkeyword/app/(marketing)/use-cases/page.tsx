"use client";

import Link from "next/link";

const USE_CASES = [
  {
    title: "Content Strategy Planning",
    description: "Build quarterly content roadmaps backed by real search data.",
    benefits: [
      "Discover what audiences want to read about",
      "Prioritize topics by search volume and opportunity",
      "Create pillar pages and topic clusters",
      "Justify content investments to stakeholders"
    ]
  },
  {
    title: "E-commerce Optimization",
    description: "Find products customers search for but can't find on your site.",
    benefits: [
      "Optimize product category pages for organic search",
      "Identify merchandising and product opportunities",
      "Boost Google Shopping visibility",
      "Improve PPC performance with better keywords"
    ]
  },
  {
    title: "Local Market Expansion",
    description: "Enter new markets with data-backed local keyword strategies.",
    benefits: [
      "Find high-opportunity local markets to expand into",
      "Build location-specific content strategies",
      "Optimize for local intent keywords",
      "Track performance by region and city"
    ]
  },
  {
    title: "Competitive Analysis",
    description: "See what your competitors rank for and find your gaps.",
    benefits: [
      "Identify keyword opportunities competitors own",
      "Find quick-win keywords to target first",
      "Understand competitive landscape better",
      "Stay ahead of market trends"
    ]
  },
  {
    title: "PPC Campaign Planning",
    description: "Build better Google Ads campaigns with smarter keyword selections.",
    benefits: [
      "Find high-intent keywords for better ROAS",
      "Reduce CPC with targeted keyword selection",
      "Expand reach with related keyword variations",
      "Improve ad relevance scores"
    ]
  },
  {
    title: "SEO Audits & Reporting",
    description: "Deliver comprehensive keyword audits to clients with confidence.",
    benefits: [
      "Show clients exactly what opportunities exist",
      "Provide data-backed recommendations",
      "Build trust with transparent reporting",
      "Justify consulting fees with real insights"
    ]
  },
];

export default function UseCasesPage() {
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
      <section className="relative px-6 py-20 max-w-5xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          How teams use <span className="ubk-orange-accent">UnboundKeyword</span>
        </h1>
        <p className="text-white/60 text-lg max-w-3xl mx-auto mb-12">
          From content strategies to competitive analysis, see how different teams leverage keyword insights.
        </p>
      </section>

      {/* Use Cases Grid */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {USE_CASES.map((useCase) => (
            <div
              key={useCase.title}
              className="bg-slate-900/40 rounded-2xl p-8 border border-white/[0.06] hover:border-[rgba(241,91,39,0.35)] transition"
            >
              <h3 className="text-2xl font-bold mb-2">{useCase.title}</h3>
              <p className="text-white/60 mb-5">{useCase.description}</p>
              <div className="space-y-2">
                {useCase.benefits.map((benefit, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-[#f97316] text-xl shrink-0">✓</span>
                    <span className="text-white/80 text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* By Role */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-12 text-center">Solutions by Role</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link href="/for/content-strategists" className="group">
            <div className="bg-slate-900/30 rounded-xl p-6 border border-white/[0.06] hover:border-[rgba(241,91,39,0.35)] transition">
              <h4 className="text-xl font-bold mb-2 group-hover:text-[#f97316] transition">📋 Content Strategists</h4>
              <p className="text-white/60 text-sm">Build data-backed content roadmaps and editorial calendars.</p>
            </div>
          </Link>
          <Link href="/for/agencies" className="group">
            <div className="bg-slate-900/30 rounded-xl p-6 border border-white/[0.06] hover:border-[rgba(241,91,39,0.35)] transition">
              <h4 className="text-xl font-bold mb-2 group-hover:text-[#f97316] transition">🏢 SEO Agencies</h4>
              <p className="text-white/60 text-sm">Deliver faster audits and better client results with keyword data.</p>
            </div>
          </Link>
          <Link href="/for/ecommerce" className="group">
            <div className="bg-slate-900/30 rounded-xl p-6 border border-white/[0.06] hover:border-[rgba(241,91,39,0.35)] transition">
              <h4 className="text-xl font-bold mb-2 group-hover:text-[#f97316] transition">🛒 E-commerce Teams</h4>
              <p className="text-white/60 text-sm">Optimize product pages and discover new merchandise opportunities.</p>
            </div>
          </Link>
          <Link href="/for/local-seo" className="group">
            <div className="bg-slate-900/30 rounded-xl p-6 border border-white/[0.06] hover:border-[rgba(241,91,39,0.35)] transition">
              <h4 className="text-xl font-bold mb-2 group-hover:text-[#f97316] transition">📍 Local SEO Specialists</h4>
              <p className="text-white/60 text-sm">Dominate local markets with location-specific keywords.</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Customer Metrics */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-12 text-center">What Our Users See</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-5xl font-black text-[#f97316] mb-3">50%</div>
            <p className="text-white/80 font-medium mb-2">Faster Content Planning</p>
            <p className="text-white/50 text-sm">Teams reduce research time with instant keyword discovery</p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-black text-[#f97316] mb-3">3x</div>
            <p className="text-white/80 font-medium mb-2">More Opportunities</p>
            <p className="text-white/50 text-sm">Uncover hidden keywords and content gaps competitors miss</p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-black text-[#f97316] mb-3">65%</div>
            <p className="text-white/80 font-medium mb-2">Increased Confidence</p>
            <p className="text-white/50 text-sm">Data-backed recommendations build client and stakeholder trust</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <div className="ubk-cta-banner rounded-3xl p-10 md:p-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Join teams using UnboundKeyword for <span className="ubk-orange-accent">better decisions</span>
          </h2>
          <p className="text-white/55 mb-8">Explore your use case. No credit card required.</p>
          <Link href="/pricing" className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full inline-block">
            Get started free
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
