"use client";

import Link from "next/link";

export default function ForLocalSEO() {
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
          For Local SEO
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Dominate local search across <span className="ubk-orange-accent">every market</span>
        </h1>
        <p className="text-white/60 text-lg max-w-3xl mx-auto mb-12">
          A massive database of localized keywords across all US states, cities, and regions. Target every market with precision.
        </p>
      </section>

      {/* Local SEO Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="space-y-8">
          <div className="flex gap-6">
            <div className="text-4xl shrink-0">🗺️</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Every City, State & Region</h3>
              <p className="text-white/60">
                Access keywords for all 50 states, major cities, and regional areas. Complete coverage of the local search landscape.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-4xl shrink-0">📊</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Local Search Volume Data</h3>
              <p className="text-white/60">
                See which keywords drive the most searches in each location. Prioritize high-demand markets for your campaigns.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-4xl shrink-0">🎯</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Multi-Location Strategy</h3>
              <p className="text-white/60">
                Build location-specific content and optimization strategies. Manage campaigns for franchises or multiple service areas.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-4xl shrink-0">🏪</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Local Intent Keywords</h3>
              <p className="text-white/60">
                Find "near me", "local", and location-specific keywords. Target customers actively looking for local solutions.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-4xl shrink-0">📍</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Map Rankings Optimization</h3>
              <p className="text-white/60">
                Optimize for Google Maps and local pack rankings. Track your performance in each market with real data.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-4xl shrink-0">🔍</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Citation & NAP Insights</h3>
              <p className="text-white/60">
                Understand local keyword performance across citations. Optimize Name, Address, Phone for better local visibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Local SEO Use Cases */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-2xl font-bold mb-8">Local SEO experts use UnboundKeyword for:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex gap-3">
            <span className="text-[#f97316] text-xl">✓</span>
            <p>Multi-location GMB optimization strategies</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316] text-xl">✓</span>
            <p>Franchise keyword targeting across all locations</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316] text-xl">✓</span>
            <p>Service area expansion planning</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316] text-xl">✓</span>
            <p>Local paid search (Google Ads) campaigns</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316] text-xl">✓</span>
            <p>Local content marketing strategies</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316] text-xl">✓</span>
            <p>Competitive local market analysis</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316] text-xl">✓</span>
            <p>Local landing page optimization</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316] text-xl">✓</span>
            <p>Regional expansion opportunity identification</p>
          </div>
        </div>
      </section>

      {/* The Opportunity */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <div className="bg-slate-900/30 rounded-2xl p-8 border border-white/[0.06]">
          <h3 className="text-2xl font-bold mb-4">Why Local Keywords Matter</h3>
          <div className="space-y-3 text-white/70">
            <p>• <span className="font-medium">46% of searches</span> include a local modifier ("near me", specific location)</p>
            <p>• <span className="font-medium">9 out of 10 people</span> research local businesses before making a decision</p>
            <p>• <span className="font-medium">Local keywords</span> typically have less competition but high purchase intent</p>
            <p>• <span className="font-medium">Market-specific optimization</span> can increase foot traffic and conversions significantly</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <div className="ubk-cta-banner rounded-3xl p-10 md:p-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Own your local market with <span className="ubk-orange-accent">data-backed strategy</span>
          </h2>
          <p className="text-white/55 mb-8">Get access to localized keywords across all 50 states and regions. Start today.</p>
          <Link href="/register" className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full inline-block">
            Dominate locally
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
