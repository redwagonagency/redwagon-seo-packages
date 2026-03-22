"use client";

import Link from "next/link";

export default function ForAgencies() {
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
          For SEO Agencies
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          The keyword research tool your <span className="ubk-orange-accent">clients actually want</span>
        </h1>
        <p className="text-white/60 text-lg max-w-3xl mx-auto mb-12">
          Deliver faster results, deeper insights, and more transparency. Give your clients real keyword data they can see and understand.
        </p>
      </section>

      {/* For Agencies */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="space-y-8">
          <div className="flex gap-6">
            <div className="text-4xl shrink-0">⚡</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Faster Project Delivery</h3>
              <p className="text-white/60">
                Find keyword opportunities in minutes, not weeks. Deliver comprehensive keyword audits that help clients see the full picture immediately.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-4xl shrink-0">🎯</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Client Transparency</h3>
              <p className="text-white/60">
                Show clients exactly what opportunities exist. Real search volume data builds trust and justifies your recommendations with confidence.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-4xl shrink-0">💼</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Upsell Opportunities</h3>
              <p className="text-white/60">
                Discover untapped keyword opportunities to expand client budgets. Show quick wins that justify increased investment in content.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-4xl shrink-0">📊</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Data-Backed Proposals</h3>
              <p className="text-white/60">
                Create proposals that sell. Use real keyword metrics, search volume, and competitive analysis to justify every recommendation.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-4xl shrink-0">👥</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Team Collaboration</h3>
              <p className="text-white/60">
                Share keyword lists with team members and clients. Organize insights into workflows that make sense for your agency.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-4xl shrink-0">🔄</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Scalable Infrastructure</h3>
              <p className="text-white/60">
                Handle unlimited clients and projects. Scale your agency without proportionally scaling your tool costs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem We Solve */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-2xl font-bold mb-8">Common Agency Pain Points We Solve:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/30 rounded-lg p-5 border border-white/[0.06]">
            <p className="text-white/80 font-medium mb-2">❌ Expensive tools</p>
            <p className="text-white/50 text-sm">per-user licensing makes scaling clients expensive</p>
          </div>
          <div className="bg-slate-900/30 rounded-lg p-5 border border-white/[0.06]">
            <p className="text-white/80 font-medium mb-2">❌ Limited insights</p>
            <p className="text-white/50 text-sm">competitors don't show you what clients actually need</p>
          </div>
          <div className="bg-slate-900/30 rounded-lg p-5 border border-white/[0.06]">
            <p className="text-white/80 font-medium mb-2">❌ Slow delivery</p>
            <p className="text-white/50 text-sm">complex interfaces waste time you could spend strategizing</p>
          </div>
          <div className="bg-slate-900/30 rounded-lg p-5 border border-white/[0.06]">
            <p className="text-white/80 font-medium mb-2">❌ Poor client communication</p>
            <p className="text-white/50 text-sm">hard to show clients why you chose specific targets</p>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-2xl font-bold mb-8">Use UnboundKeyword for:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white/80">
          <div className="flex gap-3">
            <span className="text-[#f97316]">→</span>
            <p>Keyword research reports and audits</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316]">→</span>
            <p>Content strategy development</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316]">→</span>
            <p>Competitive keyword gap analysis</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316]">→</span>
            <p>Keyword tracking dashboards</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316]">→</span>
            <p>Local SEO multi-location targeting</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#f97316]">→</span>
            <p>E-commerce category optimization</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <div className="ubk-cta-banner rounded-3xl p-10 md:p-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Give your agency a <span className="ubk-orange-accent">competitive advantage</span>
          </h2>
          <p className="text-white/55 mb-8">Trusted by growing agencies. Start free, scale as you grow.</p>
          <Link href="/register" className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full inline-block">
            Try for free
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
