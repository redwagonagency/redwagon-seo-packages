"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const PLATFORMS = [
  { icon: "📸", platform: "Instagram", desc: "Find hashtags that your ideal audience actually follows — not the oversaturated ones with 500M posts where you'll never be seen." },
  { icon: "🎵", platform: "TikTok", desc: "Trending TikTok hashtags matched to search volume so you ride waves of discovery before they peak and crash." },
  { icon: "💼", platform: "LinkedIn", desc: "Professional hashtags for B2B content with engagement rate data so your posts reach decision-makers, not just peers." },
  { icon: "𝕏", platform: "X (Twitter)", desc: "Trending topic hashtags with sentiment analysis and real-time volume spikes — so you join the conversation at the right time." },
  { icon: "📌", platform: "Pinterest", desc: "Search-driven Pinterest keywords and hashtags that drive discovery for your pins long after you post them." },
  { icon: "🎬", platform: "YouTube", desc: "YouTube tags and hashtags that help your videos surface in search and suggested feeds across every category." },
];

const FEATURES = [
  { icon: "📈", title: "Hashtag volume data", desc: "Actual post counts, weekly trends, and engagement rates per hashtag — not just raw numbers." },
  { icon: "🎯", title: "Niche hashtag finder", desc: "Identifies the sweet spot: hashtags with enough audience to matter, but not so large your post gets buried instantly." },
  { icon: "🔗", title: "Related hashtag clusters", desc: "Builds hashtag clusters around your topic so you can use 10-15 related tags that reinforce each other's reach." },
  { icon: "⚠️", title: "Banned hashtag alerts", desc: "Warns you before you use any shadowbanned or restricted hashtags that could tank your post's reach." },
];

export default function HashtagResearchPage() {
  const [query, setQuery] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) window.location.href = `/pricing?q=${encodeURIComponent(q)}&tool=hashtag-research`;
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
          <span className="ubk-dot" /> Hashtag Research Tool
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Find hashtags that<br />
          <span className="ubk-orange-accent">actually get you seen</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
          Enter any topic and discover the exact hashtags driving discovery across Instagram, TikTok, LinkedIn, and more — with engagement data for every single one.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a topic or keyword..."
            className="flex-1 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-5 py-4 text-base outline-none focus:border-[#f15b27] focus:ring-2 focus:ring-[#f15b27]/20 transition"
          />
          <button type="submit" className="ubk-btn-primary font-black px-8 py-4 rounded-xl text-base whitespace-nowrap">
            Find Hashtags →
          </button>
        </form>
        <p className="text-white/30 text-sm">No credit card required · Free trial on sign up</p>
      </section>

      {/* Stats */}
      <section className="border-y border-white/[0.07] py-8 mb-16">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-6 text-center">
          {[
            { n: "6", l: "Platforms covered" },
            { n: "1B+", l: "Hashtags in database" },
            { n: "Live", l: "Trending data" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-3xl md:text-4xl font-black ubk-orange-accent">{s.n}</div>
              <div className="text-white/50 text-sm mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Platforms */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">Every platform. One tool.</h2>
        <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">Different platforms reward different hashtag strategies. We optimize for each one separately.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLATFORMS.map((p) => (
            <div key={p.platform} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 hover:border-[#f15b27]/40 transition-colors">
              <div className="text-3xl mb-3">{p.icon}</div>
              <h3 className="font-black text-lg mb-2">{p.platform}</h3>
              <p className="text-white/55 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-black text-center mb-10">Data that makes the difference</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 flex gap-4">
              <span className="text-3xl shrink-0">{f.icon}</span>
              <div>
                <h3 className="font-black text-lg mb-1">{f.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-4xl font-black mb-4">Stop posting into the void. <span className="ubk-orange-accent">Start getting discovered.</span></h2>
        <p className="text-white/55 text-lg mb-8">The right hashtags put your content in front of people who are already looking for what you share. Find yours in seconds.</p>
        <Link href="/pricing" className="ubk-btn-primary font-black px-12 py-5 rounded-full text-lg inline-block">Start Free Trial</Link>
        <p className="text-white/30 text-sm mt-4">14-day free trial · No credit card required</p>
      </section>

      <MarketingFooter />
    </main>
  );
}
