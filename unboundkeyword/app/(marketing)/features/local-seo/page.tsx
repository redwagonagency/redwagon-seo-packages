"use client";

import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const CAPABILITIES = [
  { icon: "📍", title: "City-level keyword research", desc: "Real search volumes for any keyword in any city, DMA, or region — not extrapolated national averages. Know exactly how big the local opportunity is." },
  { icon: "🏆", title: "Local SERP analysis", desc: "See the full local pack and organic results for any keyword in any location. Know exactly who you're fighting for each spot." },
  { icon: "⭐", title: "GMB keyword intelligence", desc: "Discover the exact phrases customers search before clicking Google Business Profiles. Optimize yours and outrank the competition in the local 3-pack." },
  { icon: "🗺️", title: "Multi-location management", desc: "Manage keyword research and rank tracking across dozens of locations from one dashboard. Essential for franchises and multi-location businesses." },
  { icon: "📋", title: "Citation opportunity finder", desc: "Identify local directories and citation sources where competitors appear but your business doesn't — the fastest local link-building wins." },
  { icon: "📈", title: "Local rank tracking", desc: "Track your keyword positions city by city, with weekly snapshots showing your local pack position and organic rank separately." },
];

export default function LocalSEOFeaturePage() {
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
          <span className="ubk-dot" /> Feature: Local SEO Tools
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Own your local market<br />
          <span className="ubk-orange-accent">street by street</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
          Local keyword research and rank tracking built for businesses that need to win in specific cities, neighborhoods, and regions — not just nationally.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/pricing" className="ubk-btn-primary font-black px-10 py-4 rounded-full text-base">Start Free Trial</Link>
          <Link href="/tools/local-keywords" className="border border-white/20 text-white/80 hover:text-white font-bold px-10 py-4 rounded-full text-base transition">Try local keyword tool</Link>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/[0.07] py-8 mb-16">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-6 text-center">
          {[
            { n: "46%", l: "of Google searches have local intent" },
            { n: "88%", l: "of local mobile searches visit or call in 24h" },
            { n: "3×", l: "higher conversion rate than national SEO" },
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
        <h2 className="text-3xl font-black text-center mb-4">Every local SEO tool you need</h2>
        <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">From city-level keyword research to GMB optimization and local rank tracking — everything local SEO in one place.</p>
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

      {/* Who it's for */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-black text-center mb-10">Built for every local business type</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "🍽️", label: "Restaurants & hospitality" },
            { icon: "⚕️", label: "Medical & dental" },
            { icon: "🔧", label: "Home services" },
            { icon: "⚖️", label: "Legal & professional" },
            { icon: "🏋️", label: "Fitness & wellness" },
            { icon: "🏠", label: "Real estate" },
            { icon: "🚗", label: "Automotive" },
            { icon: "🏪", label: "Retail & e-commerce" },
          ].map((b) => (
            <div key={b.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center hover:border-[#f15b27]/40 transition-colors">
              <div className="text-2xl mb-2">{b.icon}</div>
              <div className="text-xs text-white/60 font-medium leading-snug">{b.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-4xl font-black mb-4">Your city is full of <span className="ubk-orange-accent">customers searching for you</span></h2>
        <p className="text-white/55 text-lg mb-8">Make sure you show up when they do. Local SEO tools built to help you own your market — neighborhood by neighborhood.</p>
        <Link href="/pricing" className="ubk-btn-primary font-black px-12 py-5 rounded-full text-lg inline-block">Start Free Trial</Link>
        <p className="text-white/30 text-sm mt-4">14-day free trial · No credit card required</p>
      </section>

      <MarketingFooter />
    </main>
  );
}
