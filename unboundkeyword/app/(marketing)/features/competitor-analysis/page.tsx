"use client";

import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const CAPABILITIES = [
  { icon: "🕵️", title: "Full keyword gap analysis", desc: "See every keyword a competitor ranks for that you don't. Sorted by traffic value so you know which gaps to close first." },
  { icon: "🏆", title: "Top page spy", desc: "Discover which pages drive the most traffic for any competitor. Reverse-engineer their content strategy in minutes." },
  { icon: "⚡", title: "Quick-win identifier", desc: "Keywords where competitors rank pages 2-4 that you could outrank with a single well-optimized piece of content." },
  { icon: "📈", title: "Traffic trend comparison", desc: "See how you and competitors are trending over time — who's gaining, who's losing, and where the momentum is shifting." },
  { icon: "🔗", title: "Backlink opportunity finder", desc: "Identify the domains linking to competitor pages but not yours — the most targeted link-building list money can't buy." },
  { icon: "🗺️", title: "Multi-competitor overlay", desc: "Compare up to 5 competitors in one view. See which keywords multiple competitors rank for — these are the most valuable target terms." },
];

export default function CompetitorAnalysisFeaturePage() {
  return (
    <main className="ubk-bg min-h-screen text-white">
      <nav className="relative z-30 flex items-center justify-between px-6 md:px-10 py-4 max-w-7xl mx-auto">
        <Link href="/" className="text-lg font-black tracking-tight ubk-logo">Unbound<span className="text-white/50">Keyword</span></Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-white/60 hover:text-white text-sm font-medium transition hidden sm:block">Sign in</Link>
          <Link href="/pricing" className="ubk-btn-primary text-sm font-bold px-5 py-2 rounded-full">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-20 pb-16 max-w-5xl mx-auto text-center">
        <div className="ubk-badge inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-6">
          <span className="ubk-dot" /> Feature: Competitor Analysis
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Know exactly what your<br />
          <span className="ubk-orange-accent">competitors are winning at</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
          Full competitor keyword intelligence — keyword gaps, top pages, traffic trends, and backlink opportunities. Everything you need to build a strategy that beats them.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/pricing" className="ubk-btn-primary font-black px-10 py-4 rounded-full text-base">Start Free Trial</Link>
          <Link href="/tools/competitor-research" className="border border-white/20 text-white/80 hover:text-white font-bold px-10 py-4 rounded-full text-base transition">Try free competitor tool</Link>
        </div>
      </section>

      {/* Visualization mockup */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {["You", "Competitor A", "Competitor B"].map((label, i) => (
              <div key={label} className="rounded-xl bg-white/[0.06] p-4">
                <div className="text-xs text-white/40 mb-2 uppercase tracking-wider">{label}</div>
                <div className={`text-2xl font-black ${i === 0 ? "ubk-orange-accent" : "text-white/60"}`}>
                  {["1,240", "4,580", "2,910"][i]}
                </div>
                <div className="text-xs text-white/40 mt-1">keywords ranking</div>
              </div>
            ))}
          </div>
          <div className="text-white/40 text-sm">Gap highlighted: <span className="text-[#f15b27] font-bold">3,340 keywords</span> competitors rank for that you don&apos;t</div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-black text-center mb-4">Turn competitor data into a winning strategy</h2>
        <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">Every capability is designed to surface actionable competitive intelligence — not just data to stare at.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 hover:border-[#f15b27]/40 transition-colors">
              <div className="text-3xl mb-3">{c.icon}</div>
              <h3 className="font-black text-lg mb-2">{c.title}</h3>
              <p className="text-white/55 text-sm leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-4xl font-black mb-4">Stop guessing. <span className="ubk-orange-accent">Start knowing.</span></h2>
        <p className="text-white/55 text-lg mb-8">Your best SEO strategy is hiding inside your competitors&apos; data. Find it in your first session.</p>
        <Link href="/pricing" className="ubk-btn-primary font-black px-12 py-5 rounded-full text-lg inline-block">Start Free Trial</Link>
        <p className="text-white/30 text-sm mt-4">14-day free trial · No credit card required</p>
      </section>

      <MarketingFooter />
    </main>
  );
}
