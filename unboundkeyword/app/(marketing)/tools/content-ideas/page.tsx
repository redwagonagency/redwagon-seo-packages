"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const CONTENT_TYPES = [
  { icon: "📝", type: "Blog posts", desc: "In-depth articles, listicles, how-to guides, and comparison posts — all matched to high-volume informational keywords." },
  { icon: "🎥", type: "Video scripts", desc: "YouTube topic ideas with search volume data. Find what people are already searching and turn it into video content." },
  { icon: "📱", type: "Social content", desc: "Short-form content ideas powered by question-based keywords. Perfect for Instagram, LinkedIn, and TikTok." },
  { icon: "📧", type: "Email sequences", desc: "Topic clusters for email nurture sequences — each email addressing a different search intent stage." },
  { icon: "🛍️", type: "Product pages", desc: "Commercial keywords with buying intent that map directly to product pages, category pages, or landing pages." },
  { icon: "🗂️", type: "Content clusters", desc: "Full content architecture: pillar pages, supporting articles, and internal linking structure — all planned out for you." },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Enter your topic or URL", desc: "Give us a seed topic, your website URL, or a competitor's page. We analyze the keyword landscape instantly." },
  { step: "02", title: "Get 100+ content ideas", desc: "We surface content opportunities by search intent, volume, and difficulty — prioritized by what will move the needle fastest." },
  { step: "03", title: "Build your content calendar", desc: "Save ideas to your project, assign them to writers, and track which pieces are live — all from one dashboard." },
];

export default function ContentIdeasPage() {
  const [query, setQuery] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) window.location.href = `/register?q=${encodeURIComponent(q)}&tool=content-ideas`;
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
          <span className="ubk-dot" /> Content Ideas Generator
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Never run out of<br />
          <span className="ubk-orange-accent">content ideas again</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
          Enter any topic and get 100+ content ideas backed by real search data — blog posts, videos, social content, and more. Every idea is rated by opportunity.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a topic, niche, or keyword..."
            className="flex-1 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-5 py-4 text-base outline-none focus:border-[#f15b27] focus:ring-2 focus:ring-[#f15b27]/20 transition"
          />
          <button type="submit" className="ubk-btn-primary font-black px-8 py-4 rounded-xl text-base whitespace-nowrap">
            Generate Ideas →
          </button>
        </form>
        <p className="text-white/30 text-sm">No credit card required · Free trial on sign up</p>
      </section>

      {/* Stats */}
      <section className="border-y border-white/[0.07] py-8 mb-16">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-6 text-center">
          {[
            { n: "100+", l: "Ideas per search" },
            { n: "6", l: "Content formats" },
            { n: "Real", l: "Search volume behind each" },
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
        <h2 className="text-3xl font-black text-center mb-12">From idea to content calendar in minutes</h2>
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

      {/* Content types */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">Ideas for every content format</h2>
        <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">Not just blog posts. We surface opportunities across every channel where your audience is already searching.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CONTENT_TYPES.map((c) => (
            <div key={c.type} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 hover:border-[#f15b27]/40 transition-colors">
              <div className="text-3xl mb-3">{c.icon}</div>
              <h3 className="font-black text-lg mb-2">{c.type}</h3>
              <p className="text-white/55 text-sm leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-4xl font-black mb-4">Your content calendar, <span className="ubk-orange-accent">filled instantly</span></h2>
        <p className="text-white/55 text-lg mb-8">Stop staring at a blank content calendar. Every topic idea is backed by what your audience is already searching for — so it&apos;ll actually get traffic.</p>
        <Link href="/register" className="ubk-btn-primary font-black px-12 py-5 rounded-full text-lg inline-block">Start Free Trial</Link>
        <p className="text-white/30 text-sm mt-4">14-day free trial · No credit card required</p>
      </section>

      <MarketingFooter />
    </main>
  );
}
