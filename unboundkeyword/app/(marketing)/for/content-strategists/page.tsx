"use client";

import Link from "next/link";

export default function ForContentStrategists() {
  return (
    <main className="ubk-bg min-h-screen text-white">
      {/* Header */}
      <nav className="relative z-30 flex items-center justify-between px-6 md:px-10 py-4 max-w-7xl mx-auto">
        <span className="text-lg font-black tracking-tight ubk-logo">
          Unbound<span className="text-white/50">Keyword</span>
        </span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-white/60 hover:text-white text-sm font-medium transition hidden sm:block">
            Sign in
          </Link>
          <Link href="/register" className="ubk-btn-primary text-sm font-bold px-5 py-2 rounded-full">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 py-20 max-w-5xl mx-auto text-center">
        <div className="ubk-badge inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full mb-6 justify-center">
          <span className="ubk-dot" />
          For Content Strategists
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Data-driven content strategy<br />
          starts with <span className="ubk-orange-accent">real keyword insights</span>
        </h1>
        <p className="text-white/60 text-lg max-w-3xl mx-auto mb-12">
          Discover exactly what your audience is searching for. Uncover content gaps. Build editorial calendars that rank.
        </p>
      </section>

      {/* Value Props */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="space-y-8">
          <div className="flex gap-6">
            <div className="text-4xl shrink-0">📊</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Audience Intent Discovery</h3>
              <p className="text-white/60">
                See exactly what questions your audience asks. Understand their pain points, curiosities, and needs through real search data.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-4xl shrink-0">📋</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Content Gap Analysis</h3>
              <p className="text-white/60">
                Identify high-volume, low-competition topics your competitors haven't covered. Find the fastest wins for your content roadmap.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-4xl shrink-0">🎯</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Topic Clustering</h3>
              <p className="text-white/60">
                Automatically organize keywords into clusters. Plan pillar pages, cornerstone content, and supporting articles with confidence.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-4xl shrink-0">📍</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Localized Content Planning</h3>
              <p className="text-white/60">
                Create location-specific content strategies with local keywords across all US states, cities, and regions.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-4xl shrink-0">⚔️</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Competitive Benchmarking</h3>
              <p className="text-white/60">
                See what topics competitors own. Develop differentiated content angles that capture the conversations they're missing.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-4xl shrink-0">📈</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Performance Tracking</h3>
              <p className="text-white/60">
                Monitor how your content ranks for target keywords. Track performance over time and optimize based on real data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Case */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-8">Content strategists use UnboundKeyword to:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex gap-3">
            <span className="text-[#f97316] text-xl">✓</span>
            <p>Build quarterly content roadmaps backed by search data</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316] text-xl">✓</span>
            <p>Justify content investments to stakeholders with real metrics</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316] text-xl">✓</span>
            <p>Create pillar pages and topic clusters that improve SERP visibility</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316] text-xl">✓</span>
            <p>Identify trending topics before competitors catch on</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316] text-xl">✓</span>
            <p>Plan multi-location content strategies for different markets</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316] text-xl">✓</span>
            <p>Measure content performance against keyword targets</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <div className="ubk-cta-banner rounded-3xl p-10 md:p-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Build content strategies that <span className="ubk-orange-accent">actually rank</span>
          </h2>
          <p className="text-white/55 mb-8">Start with keyword insights. No credit card required.</p>
          <Link href="/register" className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full inline-block">
            Discover keywords now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.07] py-8 text-center text-sm text-white/25">
        © 2026 UnBoundKeyword.com · All rights reserved ·{" "}
        <Link href="/privacy" className="hover:text-white/60 transition">Privacy</Link>
        {" · "}
        <Link href="/terms" className="hover:text-white/60 transition">Terms</Link>
      </footer>
    </main>
  );
}
