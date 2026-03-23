"use client";

import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const CAPABILITIES = [
  { icon: "💡", title: "Content ideas engine", desc: "Enter any topic and get 100+ content ideas organized by format, intent, and search volume. Never stare at a blank content calendar again." },
  { icon: "🗂️", title: "Topic cluster builder", desc: "Map out full content clusters with pillar pages and supporting articles. Build the topical authority that drives long-term rankings." },
  { icon: "📋", title: "Keyword-backed content briefs", desc: "One-click content briefs with target keywords, ideal word count, competitor analysis, and related questions to answer." },
  { icon: "📅", title: "Content calendar planning", desc: "Drag-and-drop content calendar with keyword assignments for each planned piece. Keep the whole team aligned on the plan." },
  { icon: "🔍", title: "Content gap finder", desc: "Automatically compares your existing content against your keyword opportunities — highlighting which topics you haven't covered yet." },
  { icon: "📈", title: "Content performance tracking", desc: "Track how each piece of content ranks, trends over time, and contributes to your overall traffic. Know what to update and when." },
];

const WORKFLOW = [
  { step: "Discover", desc: "Find high-opportunity content topics backed by real search demand" },
  { step: "Plan", desc: "Build a prioritized content calendar with keyword assignments" },
  { step: "Brief", desc: "Create detailed briefs from keyword data so writers know exactly what to create" },
  { step: "Track", desc: "Monitor content performance and rankings automatically" },
];

export default function ContentStrategyFeaturePage() {
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
          <span className="ubk-dot" /> Feature: Content Strategy
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Content that ranks<br />
          <span className="ubk-orange-accent">starts with the right data</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
          Plan, brief, and track content that actually drives traffic. From idea to ranking — every step of your content strategy powered by keyword intelligence.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/register" className="ubk-btn-primary font-black px-10 py-4 rounded-full text-base">Start Free Trial</Link>
          <Link href="/tools/content-ideas" className="border border-white/20 text-white/80 hover:text-white font-bold px-10 py-4 rounded-full text-base transition">Try content ideas tool</Link>
        </div>
      </section>

      {/* Content workflow */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {WORKFLOW.map((w, i) => (
            <div key={w.step} className="text-center">
              <div className="w-8 h-8 rounded-full bg-[#f15b27]/20 border border-[#f15b27]/40 flex items-center justify-center text-[#f15b27] font-black text-sm mx-auto mb-3">{i + 1}</div>
              <div className="font-black text-base mb-1 ubk-orange-accent">{w.step}</div>
              <div className="text-white/50 text-xs leading-relaxed">{w.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-black text-center mb-4">Every content strategy tool in one suite</h2>
        <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">From discovery to tracking — every step of your content workflow gets smarter with keyword data behind it.</p>
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

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-6 pb-20 text-center">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: "3×", l: "more content published per month" },
              { n: "85%", l: "of briefs turn into ranking content" },
              { n: "2×", l: "faster from idea to published" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-4xl font-black ubk-orange-accent mb-2">{s.n}</div>
                <div className="text-white/55 text-sm">{s.l}</div>
              </div>
            ))}
          </div>
          <p className="text-white/30 text-xs mt-6">Average metrics from UnboundKeyword content teams surveyed in 2024</p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-4xl font-black mb-4">Build a content engine that <span className="ubk-orange-accent">runs on data</span></h2>
        <p className="text-white/55 text-lg mb-8">Stop guessing what to create. Start building content that&apos;s designed to rank from the first draft.</p>
        <Link href="/register" className="ubk-btn-primary font-black px-12 py-5 rounded-full text-lg inline-block">Start Free Trial</Link>
        <p className="text-white/30 text-sm mt-4">14-day free trial · No credit card required</p>
      </section>

      <MarketingFooter />
    </main>
  );
}
