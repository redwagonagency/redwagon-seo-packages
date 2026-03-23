"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const FEATURES = [
  { icon: "📍", title: "City + keyword combos", desc: "Automatically generates 'near me', city-specific, and DMA-level keyword variations from a single seed term." },
  { icon: "🗺️", title: "Multi-location research", desc: "Run keyword research across dozens of cities simultaneously. Perfect for franchises or multi-location businesses." },
  { icon: "📊", title: "Local search volume", desc: "Real local search volumes — not extrapolated national numbers. See exactly how a keyword performs in a specific city." },
  { icon: "🏆", title: "Local SERP preview", desc: "See who's ranking locally for any keyword. Identify the pack players, local competitors, and directory listings." },
  { icon: "⭐", title: "GMB keyword finder", desc: "Find the exact phrases customers search before clicking Google Business Profiles — optimize yours or outrank competitors." },
  { icon: "📋", title: "NAP consistency checker", desc: "Ensure your business name, address, and phone number are consistent across 50+ local citations and directories." },
];

const PAIN_POINTS = [
  ["Using national keywords that don't convert locally", "Location-specific volumes with buying-intent signals"],
  ["Running keyword research city by city manually", "Bulk multi-city research in one shot"],
  ["Guessing which local terms customers actually use", "Real local search data from actual queries"],
  ["Missing 'near me' and implicit local searches", "Full local intent keyword expansion automatically"],
  ["Losing GMB impressions to competitors", "GMB keyword insights to dominate local pack"],
];

export default function LocalKeywordsPage() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = `${query.trim()} ${city.trim()}`.trim();
    if (q) window.location.href = `/register?q=${encodeURIComponent(q)}&tool=local-keywords`;
  }

  return (
    <main className="ubk-bg min-h-screen text-white">
      <nav className="relative z-30 flex items-center justify-between px-6 md:px-10 py-4 max-w-7xl mx-auto">
        <Link href="/" className="text-lg font-black tracking-tight ubk-logo">Unbound<span className="text-white/50">Keyword</span></Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-white/60 hover:text-white text-sm font-medium transition hidden sm:block">Sign in</Link>
          <Link href="/register" className="ubk-btn-primary text-sm font-bold px-5 py-2 rounded-full">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-20 pb-10 max-w-5xl mx-auto text-center">
        <div className="ubk-badge inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-6">
          <span className="ubk-dot" /> Local SEO Keyword Tool
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Find local keywords that<br />
          <span className="ubk-orange-accent">bring customers to your door</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
          Enter any keyword and city. Get every local search variation — with real local volumes, intent signals, and competitor rankings.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Keyword (e.g. plumber)"
            className="flex-1 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-5 py-4 text-base outline-none focus:border-[#f15b27] focus:ring-2 focus:ring-[#f15b27]/20 transition"
          />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City or DMA (e.g. Austin TX)"
            className="flex-1 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-5 py-4 text-base outline-none focus:border-[#f15b27] focus:ring-2 focus:ring-[#f15b27]/20 transition"
          />
          <button type="submit" className="ubk-btn-primary font-black px-8 py-4 rounded-xl text-base whitespace-nowrap">
            Find Keywords →
          </button>
        </form>
        <p className="text-white/30 text-sm">No credit card required · Free trial on sign up</p>
      </section>

      {/* Stats */}
      <section className="border-y border-white/[0.07] py-8 mb-16">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-6 text-center">
          {[
            { n: "200+", l: "Countries & cities" },
            { n: "10M+", l: "Local keyword combos" },
            { n: "99%", l: "Local SERP accuracy" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-3xl md:text-4xl font-black ubk-orange-accent">{s.n}</div>
              <div className="text-white/50 text-sm mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">Every local keyword signal in one tool</h2>
        <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">From city-level search volume to GMB optimization — everything you need to own local search in your market.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 hover:border-[#f15b27]/40 transition-colors">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-black text-lg mb-2">{f.title}</h3>
              <p className="text-white/55 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pain vs Fix */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-black text-center mb-10">Local SEO before vs. <span className="ubk-orange-accent">after UnboundKeyword</span></h2>
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
        <h2 className="text-4xl font-black mb-4">Your city. Your keywords. Your customers.</h2>
        <p className="text-white/55 text-lg mb-8">Start finding the local keywords that put your business at the top of search results — where customers in your city are already looking.</p>
        <Link href="/register" className="ubk-btn-primary font-black px-12 py-5 rounded-full text-lg inline-block">Start Free Trial</Link>
        <p className="text-white/30 text-sm mt-4">14-day free trial · No credit card required</p>
      </section>

      <MarketingFooter />
    </main>
  );
}
