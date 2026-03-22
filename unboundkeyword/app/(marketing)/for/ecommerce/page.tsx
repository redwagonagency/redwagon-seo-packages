"use client";

import Link from "next/link";

export default function ForEcommerce() {
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
          For E-commerce
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Find products customers are <span className="ubk-orange-accent">searching for</span>
        </h1>
        <p className="text-white/60 text-lg max-w-3xl mx-auto mb-12">
          Optimize category pages, product descriptions, and merchandising with keyword data that shows real demand.
        </p>
      </section>

      {/* Value Props */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="space-y-8">
          <div className="flex gap-6">
            <div className="text-4xl shrink-0">🛒</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Product Discovery Opportunities</h3>
              <p className="text-white/60">
                See what products customers search for that you carry but don't rank for. Uncover hidden revenue opportunities.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-4xl shrink-0">📝</div>
            <div>
              <h3 className="text-xl font-bold mb-2">SEO-Optimized Descriptions</h3>
              <p className="text-white/60">
                Write product descriptions and category content around keywords customers actually search. Improve visibility and sales.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-4xl shrink-0">🎯</div>
            <div>
              <h3 className="text-xl font-bold mb-2">PPC & Paid Search Strategy</h3>
              <p className="text-white/60">
                Find high-intent keywords for Google Shopping and PPC campaigns. Improve ROAS with smarter keyword bidding.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-4xl shrink-0">📍</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Local Inventory Keywords</h3>
              <p className="text-white/60">
                Target local product searches across multiple regions. Optimize for local keywords and drive in-store foot traffic.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-4xl shrink-0">⚔️</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Competitive Benchmarking</h3>
              <p className="text-white/60">
                See which products competitors rank for. Find gaps to gain market share in high-opportunity categories.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-4xl shrink-0">📊</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Seasonal Trend Planning</h3>
              <p className="text-white/60">
                Identify seasonal keyword spikes before they happen. Plan inventory and content around future demand.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* E-commerce Use Cases */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-2xl font-bold mb-8">E-commerce teams use UnboundKeyword to:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex gap-3">
            <span className="text-[#f97316] text-xl">✓</span>
            <p>Optimize product category pages for organic search</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316] text-xl">✓</span>
            <p>Identify product gaps and new merchandise opportunities</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316] text-xl">✓</span>
            <p>Plan seasonal content and promotional campaigns</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316] text-xl">✓</span>
            <p>Improve product description keyword targeting</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316] text-xl">✓</span>
            <p>Find long-tail keywords with higher purchase intent</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316] text-xl">✓</span>
            <p>Boost Google Shopping feed visibility</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316] text-xl">✓</span>
            <p>Dominate local/regional e-commerce markets</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316] text-xl">✓</span>
            <p>Reduce paid search CPC with better keyword data</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <div className="ubk-cta-banner rounded-3xl p-10 md:p-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Unlock hidden <span className="ubk-orange-accent">e-commerce opportunities</span>
          </h2>
          <p className="text-white/55 mb-8">Find products customers search for but can't find. Start optimizing today.</p>
          <Link href="/register" className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full inline-block">
            Start free
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
