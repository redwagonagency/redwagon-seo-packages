"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const CAPABILITIES = [
  { icon: "🔤", title: "Full A-Z autocomplete", desc: "Runs every letter A through Z against your seed keyword and pulls every Google autocomplete suggestion in one batch run." },
  { icon: "🔢", title: "0-9 number expansion", desc: "Adds numerical prefixes and suffixes to surface queries like 'best 10 [keyword]', '[keyword] for 2025', and similar number-based searches." },
  { icon: "❓", title: "Question prefix explorer", desc: "Runs every question prefix (who, what, where, when, why, how) to surface question-based keywords perfect for FAQ and featured snippet content." },
  { icon: "📊", title: "Volume for every result", desc: "Every A-Z result comes with search volume, keyword difficulty, and CPC — not just a raw suggestion list. Full data for full decisions." },
  { icon: "🎯", title: "Intent labeling", desc: "Each keyword gets automatically labeled by intent — informational, commercial, navigational, or transactional — so you create the right content for it." },
  { icon: "💡", title: "Gap highlight mode", desc: "Cross-references A-Z results against your existing content. Keywords you haven&apos;t covered yet get highlighted as content opportunities." },
];

export default function AZExplorerFeaturePage() {
  const [query, setQuery] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) window.location.href = `/pricing?q=${encodeURIComponent(q)}&tool=az-keywords`;
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
      <section className="relative px-6 pt-20 pb-16 max-w-5xl mx-auto text-center">
        <div className="ubk-badge inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-6">
          <span className="ubk-dot" /> Feature: A-Z Keyword Explorer
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          The A-Z explorer that<br />
          <span className="ubk-orange-accent">leaves nothing behind</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
          The most thorough autocomplete expansion tool available. Every letter, every number, every question — with full metrics for every single result.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a keyword or topic to explore..."
            className="flex-1 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-5 py-4 text-base outline-none focus:border-[#f15b27] focus:ring-2 focus:ring-[#f15b27]/20 transition"
          />
          <button type="submit" className="ubk-btn-primary font-black px-8 py-4 rounded-xl text-base whitespace-nowrap">
            Explore Now →
          </button>
        </form>
        <p className="text-white/30 text-sm">No credit card required · Free trial on sign up</p>
      </section>

      {/* Letter grid */}
      <section className="max-w-3xl mx-auto px-6 pb-16 text-center">
        <p className="text-white/40 text-sm font-bold uppercase tracking-wider mb-4">Covers every letter, number, and question prefix</p>
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => (
            <span key={l} className="w-8 h-8 rounded-lg bg-[#f15b27]/20 border border-[#f15b27]/40 flex items-center justify-center text-xs font-black text-[#f15b27]">{l}</span>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {"0123456789".split("").map((n) => (
            <span key={n} className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-xs font-black text-white/50">{n}</span>
          ))}
          {["how", "what", "where", "when", "why", "who"].map((q) => (
            <span key={q} className="px-3 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-xs font-black text-white/50">{q}</span>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/[0.07] py-8 mb-16">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-6 text-center">
          {[
            { n: "36+", l: "Expansion prefixes" },
            { n: "500+", l: "Average results per seed" },
            { n: "Full", l: "Metrics on every result" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-3xl md:text-4xl font-black ubk-orange-accent">{s.n}</div>
              <div className="text-white/50 text-sm mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-black text-center mb-4">The most thorough expansion tool available</h2>
        <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">We go further than any other tool — letters, numbers, questions, and gap analysis against your existing content.</p>
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
        <h2 className="text-4xl font-black mb-4">Every keyword idea, <span className="ubk-orange-accent">nothing left out</span></h2>
        <p className="text-white/55 text-lg mb-8">The A-Z Explorer is included with every UnboundKeyword plan. Start finding the keywords you&apos;ve been missing.</p>
        <Link href="/pricing" className="ubk-btn-primary font-black px-12 py-5 rounded-full text-lg inline-block">Start Free Trial</Link>
        <p className="text-white/30 text-sm mt-4">14-day free trial · No credit card required</p>
      </section>

      <MarketingFooter />
    </main>
  );
}
