"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const FEATURES = [
  { icon: "🔤", title: "Full alphabet expansion", desc: "Appends A through Z to your seed keyword and discovers every suggestion Google autocomplete has ever shown — hundreds of variations instantly." },
  { icon: "🔢", title: "Number variations too", desc: "Goes beyond A-Z — also finds 0-9 variations and question-based prefixes like 'how', 'what', 'best', 'cheap' for your seed." },
  { icon: "📊", title: "Search volume for all", desc: "Every A-Z result comes with search volume, keyword difficulty, and CPC data. No more guessing which variations are worth targeting." },
  { icon: "🎯", title: "Intent classification", desc: "Each keyword gets labeled: informational, commercial, navigational, or transactional — so you build the right kind of content for each." },
  { icon: "📁", title: "Bulk list to keywords", desc: "Paste in your entire sitemap or product catalog. Get A-Z expansion for every single page in one batch run." },
  { icon: "💡", title: "Content gap spotter", desc: "Highlights A-Z keywords where you have zero existing content — the fastest way to find your next 50 blog post ideas." },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Enter your seed keyword", desc: "Type any keyword, topic, product, or niche. Our crawler hits all autocomplete sources simultaneously." },
  { step: "02", title: "Get the full A-Z expansion", desc: "We surface every suggestion — from '[keyword] advice' to '[keyword] zones' — with metrics for each." },
  { step: "03", title: "Filter and prioritize", desc: "Sort by volume, difficulty, or intent. Export the ones that match your strategy to your keyword list." },
];

export default function AZKeywordsPage() {
  const [query, setQuery] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) window.location.href = `/register?q=${encodeURIComponent(q)}&tool=az-keywords`;
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
          <span className="ubk-dot" /> A-Z Keyword Explorer
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Discover every keyword<br />
          <span className="ubk-orange-accent">from A to Z</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
          Enter any topic and we'll surface every autocomplete suggestion from A to Z — with search volume, difficulty, and intent for every single one.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your keyword or topic..."
            className="flex-1 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-5 py-4 text-base outline-none focus:border-[#f15b27] focus:ring-2 focus:ring-[#f15b27]/20 transition"
          />
          <button type="submit" className="ubk-btn-primary font-black px-8 py-4 rounded-xl text-base whitespace-nowrap">
            Explore A to Z →
          </button>
        </form>

        {/* Letter preview */}
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto mb-4">
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => (
            <span key={l} className="w-8 h-8 rounded-lg bg-white/[0.07] border border-white/10 flex items-center justify-center text-xs font-black text-white/40">{l}</span>
          ))}
        </div>
        <p className="text-white/30 text-sm">No credit card required · Free trial on sign up</p>
      </section>

      {/* Stats */}
      <section className="border-y border-white/[0.07] py-8 mb-16">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-6 text-center">
          {[
            { n: "26×", l: "More keyword ideas per seed" },
            { n: "500+", l: "Average suggestions per run" },
            { n: "100%", l: "Autocomplete sourced data" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-3xl md:text-4xl font-black ubk-orange-accent">{s.n}</div>
              <div className="text-white/50 text-sm mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-black text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map((h) => (
            <div key={h.step} className="text-center">
              <div className="text-5xl font-black ubk-orange-accent mb-4">{h.step}</div>
              <h3 className="font-black text-xl mb-2">{h.title}</h3>
              <p className="text-white/55 text-sm leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">More than just letters</h2>
        <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">A-Z is just the start. We go deeper with numbers, questions, and intent signals so every keyword comes with a plan.</p>
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

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-4xl font-black mb-4">Every keyword, <span className="ubk-orange-accent">nothing left out</span></h2>
        <p className="text-white/55 text-lg mb-8">Stop leaving keyword ideas on the table. The A-Z explorer surfaces them all — your next 100 content ideas are already in there.</p>
        <Link href="/register" className="ubk-btn-primary font-black px-12 py-5 rounded-full text-lg inline-block">Start Free Trial</Link>
        <p className="text-white/30 text-sm mt-4">14-day free trial · No credit card required</p>
      </section>

      <MarketingFooter />
    </main>
  );
}
