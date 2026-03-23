"use client";

import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const CAPABILITIES = [
  { icon: "🌱", title: "Seed keyword expansion", desc: "Enter any keyword and instantly get hundreds of related variations grouped by topic, intent, and difficulty — ready to build into a full content strategy." },
  { icon: "❓", title: "Question & PAA keywords", desc: "Surfaces every 'People Also Ask' question and question-based keyword variation. These drive featured snippets and FAQ schema that dominate SERPs." },
  { icon: "📊", title: "Volume & difficulty scoring", desc: "Every keyword comes with search volume, difficulty score, CPC, and a traffic potential estimate — so you always know exactly what you're working with." },
  { icon: "🎯", title: "Search intent classification", desc: "Automatically labels keywords as informational, commercial, navigational, or transactional — so every piece of content gets targeted correctly." },
  { icon: "🗂️", title: "Keyword clustering", desc: "Groups related keywords into topic clusters automatically. Build your content architecture around topical authority instead of individual keywords." },
  { icon: "📋", title: "Bulk keyword analysis", desc: "Paste in a list of thousands of keywords and get metrics, intent labels, and difficulty scores for all of them at once." },
  { icon: "🔤", title: "A-Z keyword explorer", desc: "Runs A-Z autocomplete expansion on any seed term — surfacing every keyword Google autocomplete has ever suggested on that topic." },
  { icon: "📈", title: "Trend analysis", desc: "12-month and 5-year trend charts for every keyword. Know if you&apos;re targeting a rising star or a declining trend before you invest in the content." },
];

export default function KeywordResearchFeaturePage() {
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
      <section className="relative px-6 pt-20 pb-16 max-w-5xl mx-auto text-center">
        <div className="ubk-badge inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-6">
          <span className="ubk-dot" /> Feature: Keyword Research
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          The most complete<br />
          <span className="ubk-orange-accent">keyword research suite</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
          From seed expansion to topic clusters — every keyword research tool you need in one place. With better data, smarter filtering, and results in under 30 seconds.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/register" className="ubk-btn-primary font-black px-10 py-4 rounded-full text-base">Start Free Trial</Link>
          <Link href="/tools/keyword-ideas" className="border border-white/20 text-white/80 hover:text-white font-bold px-10 py-4 rounded-full text-base transition">Try free keyword tool</Link>
        </div>
      </section>

      {/* Capabilities */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-black text-center mb-4">Everything keyword research should be</h2>
        <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">8 research modes covering every keyword discovery need — from quick topic expansion to deep bulk analysis.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:border-[#f15b27]/40 transition-colors">
              <div className="text-2xl mb-3">{c.icon}</div>
              <h3 className="font-black text-base mb-2">{c.title}</h3>
              <p className="text-white/50 text-xs leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="max-w-4xl mx-auto px-6 pb-20 text-center">
        <h2 className="text-3xl font-black mb-6">Why switch from other keyword tools?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { tool: "vs. Google Keyword Planner", desc: "GKP rounds volumes and hides competitive data. We show exact monthly searches, difficulty, CPC, and full keyword ideas — not just broad match suggestions." },
            { tool: "vs. Ahrefs / Semrush", desc: "Same quality signals at a fraction of the cost. No module lock-ins, no per-seat pricing, no hidden add-ons. Everything's included — even for small teams." },
            { tool: "vs. Ubersuggest", desc: "More keyword expansion sources, smarter clustering, and deeper SERP analysis. Built for teams that need to act on data, not just look at it." },
          ].map((v) => (
            <div key={v.tool} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left">
              <div className="text-[#f15b27] font-black text-sm mb-3">{v.tool}</div>
              <p className="text-white/60 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-4xl font-black mb-4">Start researching smarter, <span className="ubk-orange-accent">today</span></h2>
        <p className="text-white/55 text-lg mb-8">Get the full keyword research suite — every expansion method, every metric, every filter — in your first session.</p>
        <Link href="/register" className="ubk-btn-primary font-black px-12 py-5 rounded-full text-lg inline-block">Start Free Trial</Link>
        <p className="text-white/30 text-sm mt-4">14-day free trial · No credit card required</p>
      </section>

      <MarketingFooter />
    </main>
  );
}
