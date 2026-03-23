"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const METRICS = [
  { icon: "📊", label: "Search Volume", desc: "Monthly searches with 12-month trend chart" },
  { icon: "⚡", label: "Difficulty Score", desc: "0-100 ranking difficulty with explanation" },
  { icon: "💰", label: "CPC Value", desc: "Cost-per-click in Google Ads right now" },
  { icon: "🎯", label: "Search Intent", desc: "Informational, commercial, navigational, transactional" },
  { icon: "📈", label: "Click Share", desc: "Organic vs paid click distribution" },
  { icon: "🌍", label: "Global Data", desc: "Volume across 100+ countries broken down" },
];

const SERP_FEATURES = [
  "Featured snippet presence", "People Also Ask boxes", "Video carousels", "Image packs", "Shopping ads", "Local pack", "Knowledge graph", "Top stories",
];

export default function KeywordOverviewToolPage() {
  const [query, setQuery] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) window.location.href = `/pricing?q=${encodeURIComponent(q)}&tool=keyword-overview`;
  }

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
      <section className="relative px-6 pt-20 pb-10 max-w-5xl mx-auto text-center">
        <div className="ubk-badge inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-6">
          <span className="ubk-dot" /> Keyword Overview Tool
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Deep dive any keyword<br />
          <span className="ubk-orange-accent">in under 10 seconds</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
          Volume, difficulty, intent, trends, SERP features, click distribution, and top-ranking pages — every metric for any keyword, instantly.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter any keyword..."
            className="flex-1 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-5 py-4 text-base outline-none focus:border-[#f15b27] focus:ring-2 focus:ring-[#f15b27]/20 transition"
          />
          <button type="submit" className="ubk-btn-primary font-black px-8 py-4 rounded-xl text-base whitespace-nowrap">
            Analyze Keyword →
          </button>
        </form>
        <p className="text-white/30 text-sm">No credit card required · Free trial on sign up</p>
      </section>

      {/* Stats row */}
      <section className="border-y border-white/[0.07] py-8 mb-16">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-6 text-center">
          {[
            { n: "20+", l: "Metrics per keyword" },
            { n: "100+", l: "Countries supported" },
            { n: "Live", l: "SERP data updated" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-3xl md:text-4xl font-black ubk-orange-accent">{s.n}</div>
              <div className="text-white/50 text-sm mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Metrics grid */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">Every metric that matters</h2>
        <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">One keyword. Twenty metrics. All the data you need to decide if it&apos;s worth targeting — in one clean view.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {METRICS.map((m) => (
            <div key={m.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 flex gap-4 items-start hover:border-[#f15b27]/40 transition-colors">
              <span className="text-2xl mt-0.5">{m.icon}</span>
              <div>
                <h3 className="font-black text-base mb-1">{m.label}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SERP features */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-black text-center mb-6">SERP features detected automatically</h2>
        <p className="text-white/50 text-center mb-8">We check which SERP features appear for every keyword so you know exactly what type of content to create to win that spot.</p>
        <div className="flex flex-wrap justify-center gap-3">
          {SERP_FEATURES.map((f) => (
            <span key={f} className="px-4 py-2 rounded-full border border-white/15 bg-white/[0.04] text-white/70 text-sm font-medium">{f}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-4xl font-black mb-4">Know before you write. <span className="ubk-orange-accent">Every time.</span></h2>
        <p className="text-white/55 text-lg mb-8">Stop targeting keywords without data. The keyword overview gives you the full picture — so every piece of content has a real shot at page 1.</p>
        <Link href="/pricing" className="ubk-btn-primary font-black px-12 py-5 rounded-full text-lg inline-block">Start Free Trial</Link>
        <p className="text-white/30 text-sm mt-4">14-day free trial · No credit card required</p>
      </section>

      <MarketingFooter />
    </main>
  );
}
