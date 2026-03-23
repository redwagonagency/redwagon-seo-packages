"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const FEATURES = [
  { icon: "🕵️", title: "Keyword gap spy", desc: "See every keyword your competitor ranks for — sorted by traffic value so you know exactly where to attack first." },
  { icon: "📈", title: "Traffic estimates", desc: "Estimated monthly visits per keyword with click-through projections and estimated traffic value." },
  { icon: "⚡", title: "Quick-win finder", desc: "Automatically surfaces keywords where competitors rank on page 2-3 that you could leapfrog with one good page." },
  { icon: "🏆", title: "Top pages reveal", desc: "See which pages drive the most organic traffic for any domain. Reverse-engineer exactly what's working." },
  { icon: "🗺️", title: "Ranking landscape", desc: "Visualize how you and your competitors overlap across keyword clusters — find the gaps instantly." },
  { icon: "📋", title: "Bulk export", desc: "Export competitor keywords by the thousands into CSV or push directly to your keyword lists." },
];

const PAIN_POINTS = [
  ["Guessing what competitors rank for", "See every keyword, every position, real traffic data"],
  ["Waiting weeks for competitor audits", "Full competitor landscape in under 5 minutes"],
  ["Missing the easy wins", "Quick-win filter highlights keywords you can rank for now"],
  ["Expensive tools charging per domain", "Unlimited competitor lookups on every plan"],
  ["Scattered data across 4 tools", "Competitor research, keyword data, intent — all one place"],
];

export default function CompetitorResearchPage() {
  const [domain, setDomain] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = domain.trim().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    if (q) window.location.href = `/pricing?competitor=${encodeURIComponent(q)}&tool=competitor`;
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
          <span className="ubk-dot" /> Competitor Research Tool
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          See every keyword<br />
          <span className="ubk-orange-accent">your competitors rank for</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
          Enter any domain and get their full keyword portfolio — with traffic estimates, ranking positions, and the quick wins you can steal today.
        </p>

        {/* Search box */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-6">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter a competitor's domain (e.g. ahrefs.com)"
            className="flex-1 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-5 py-4 text-base outline-none focus:border-[#f15b27] focus:ring-2 focus:ring-[#f15b27]/20 transition"
          />
          <button type="submit" className="ubk-btn-primary font-black px-8 py-4 rounded-xl text-base whitespace-nowrap">
            Spy on Domain →
          </button>
        </form>
        <p className="text-white/30 text-sm">No credit card required · Free trial on sign up</p>
      </section>

      {/* Social proof numbers */}
      <section className="border-y border-white/[0.07] py-8 mb-16">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-6 text-center">
          {[
            { n: "50M+", l: "Keywords tracked" },
            { n: "2M+", l: "Domains indexed" },
            { n: "<30s", l: "Results delivered" },
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
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">Everything about your competitor's SEO</h2>
        <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">Stop guessing. Start knowing. Every keyword, ranked position, and traffic estimate — organized for action.</p>
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

      {/* Pain vs Fix table */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-black text-center mb-10">The old way vs. the <span className="ubk-orange-accent">UnboundKeyword way</span></h2>
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-2 bg-white/[0.06] border-b border-white/10">
            <div className="px-6 py-3 text-xs font-black uppercase tracking-widest text-white/40">Before</div>
            <div className="px-6 py-3 text-xs font-black uppercase tracking-widest text-[#f15b27]">After</div>
          </div>
          {PAIN_POINTS.map(([before, after], i) => (
            <div key={i} className="grid grid-cols-2 border-b border-white/[0.06] last:border-0">
              <div className="px-6 py-4 text-white/50 text-sm flex items-start gap-2">
                <span className="mt-0.5 text-red-400 shrink-0">✗</span>{before}
              </div>
              <div className="px-6 py-4 text-white/80 text-sm flex items-start gap-2 bg-white/[0.02]">
                <span className="mt-0.5 text-emerald-400 shrink-0">✓</span>{after}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-4xl font-black mb-4">Ready to see what they&apos;re hiding?</h2>
        <p className="text-white/55 text-lg mb-8">Your competitors are ranking for thousands of keywords you haven't considered yet. Start your free trial and find them all.</p>
        <Link href="/pricing" className="ubk-btn-primary font-black px-12 py-5 rounded-full text-lg inline-block">
          Start Free Trial
        </Link>
        <p className="text-white/30 text-sm mt-4">14-day free trial · No credit card required</p>
      </section>

      <MarketingFooter />
    </main>
  );
}
