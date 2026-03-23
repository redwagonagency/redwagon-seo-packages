"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const EXPANSION_TYPES = [
  { icon: "🌱", title: "Seed expansion", desc: "Takes one keyword and expands it into hundreds of related terms, phrases, and long-tail variations — all with search volume." },
  { icon: "❓", title: "Question keywords", desc: "Surfaces every 'who', 'what', 'where', 'when', 'why', 'how' variation. Perfect for featured snippets and FAQ content." },
  { icon: "🔍", title: "Related searches", desc: "Pulls the 'searches related to' section at the bottom of Google SERPs — these are the next keywords searchers look for." },
  { icon: "💬", title: "People Also Ask", desc: "Every PAA question for your seed keyword — grab these to answer directly in your content and secure PAA boxes." },
  { icon: "📦", title: "Amazon & shopping", desc: "E-commerce keyword ideas from Amazon suggest — words buyers actually type when they're ready to purchase." },
  { icon: "🗂️", title: "Topic clustering", desc: "Groups related keyword ideas into content clusters automatically — so you can build topical authority faster." },
];

const PAIN_POINTS = [
  ["Running out of keyword ideas after 5 minutes", "Hundreds of expansions from any single seed term"],
  ["Targeting head terms that are too competitive", "Long-tail variations with lower difficulty, same intent"],
  ["Skipping question keywords and PAA", "Full question keyword set for every seed"],
  ["Building pages in silos with no structure", "Auto-clustered topic maps for content architecture"],
  ["Missing buyer-intent keywords", "Shopping and transactional variants surface automatically"],
];

export default function KeywordIdeasPage() {
  const [query, setQuery] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) window.location.href = `/pricing?q=${encodeURIComponent(q)}&tool=keyword-ideas`;
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
          <span className="ubk-dot" /> Keyword Ideas Tool
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Expand one keyword into<br />
          <span className="ubk-orange-accent">hundreds of ideas instantly</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
          Type in any seed keyword and get hundreds of related variations — questions, long-tail phrases, shopping terms — all ranked by traffic potential.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a seed keyword..."
            className="flex-1 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-5 py-4 text-base outline-none focus:border-[#f15b27] focus:ring-2 focus:ring-[#f15b27]/20 transition"
          />
          <button type="submit" className="ubk-btn-primary font-black px-8 py-4 rounded-xl text-base whitespace-nowrap">
            Expand Keyword →
          </button>
        </form>
        <p className="text-white/30 text-sm">No credit card required · Free trial on sign up</p>
      </section>

      {/* Stats */}
      <section className="border-y border-white/[0.07] py-8 mb-16">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-6 text-center">
          {[
            { n: "500+", l: "Ideas from one seed" },
            { n: "6", l: "Expansion methods" },
            { n: "Auto", l: "Topic clustering included" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-3xl md:text-4xl font-black ubk-orange-accent">{s.n}</div>
              <div className="text-white/50 text-sm mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Expansion Types */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">6 ways to expand every keyword</h2>
        <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">We don&apos;t just find synonyms. We pull ideas from every expansion source: autocomplete, PAA, related searches, shopping, and more.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {EXPANSION_TYPES.map((e) => (
            <div key={e.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 hover:border-[#f15b27]/40 transition-colors">
              <div className="text-3xl mb-3">{e.icon}</div>
              <h3 className="font-black text-lg mb-2">{e.title}</h3>
              <p className="text-white/55 text-sm leading-relaxed">{e.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pain vs Fix */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-black text-center mb-10">Keyword research before vs. <span className="ubk-orange-accent">after</span></h2>
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-2 bg-white/[0.06] border-b border-white/10">
            <div className="px-6 py-3 text-xs font-black uppercase tracking-widest text-white/40">Before</div>
            <div className="px-6 py-3 text-xs font-black uppercase tracking-widest text-[#f15b27]">After</div>
          </div>
          {PAIN_POINTS.map(([before, after], i) => (
            <div key={i} className="grid grid-cols-2 border-b border-white/[0.06] last:border-0">
              <div className="px-6 py-4 text-white/50 text-sm flex items-start gap-2"><span className="mt-0.5 text-red-400 shrink-0">✗</span>{before}</div>
              <div className="px-6 py-4 text-white/80 text-sm flex items-start gap-2 bg-white/[0.02]"><span className="mt-0.5 text-emerald-400 shrink-0">✓</span>{after}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-4xl font-black mb-4">One seed turns into <span className="ubk-orange-accent">a full content strategy</span></h2>
        <p className="text-white/55 text-lg mb-8">The best keyword strategies start with thorough expansion. Get hundreds of keyword ideas, clustered by topic and ranked by opportunity.</p>
        <Link href="/pricing" className="ubk-btn-primary font-black px-12 py-5 rounded-full text-lg inline-block">Start Free Trial</Link>
        <p className="text-white/30 text-sm mt-4">14-day free trial · No credit card required</p>
      </section>

      <MarketingFooter />
    </main>
  );
}
