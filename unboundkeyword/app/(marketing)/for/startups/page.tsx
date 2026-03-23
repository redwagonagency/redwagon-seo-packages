"use client";

import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const PAIN_POINTS = [
  {
    pain: "No budget for a full-time SEO or expensive tools",
    fix: "Enterprise-level keyword intelligence at a fraction of the price. One tool replaces the whole stack.",
  },
  {
    pain: "Burning runway on paid ads without an organic strategy",
    fix: "Build the organic keyword foundation that makes every future paid dollar go further — and eventually replaces ad spend entirely.",
  },
  {
    pain: "Trying to rank in a crowded market as a new domain",
    fix: "We find the underserved keyword angles in any niche where a new domain can rank — without needing 10 years of authority.",
  },
  {
    pain: "Content team writing without a keyword strategy",
    fix: "Give every writer a prioritized keyword brief. Every piece of content contributes to a coherent topical strategy from day one.",
  },
];

const STARTUP_BENEFITS = [
  { icon: "🚀", title: "Rank before you have authority", desc: "Long-tail keyword strategies that new domains can win. We find where you can rank today, not after 2 years of link building." },
  { icon: "💸", title: "Reduce paid acquisition costs", desc: "Every page that ranks organically is a CAC you never paid. Build SEO early and watch your unit economics improve month over month." },
  { icon: "📊", title: "Prove content ROI to investors", desc: "Track organic traffic growth, keyword positions, and estimated traffic value — clean data you can put in your growth deck." },
  { icon: "⚡", title: "Move fast with keyword briefs", desc: "Stop briefing writers in the dark. Export keyword-backed content briefs in one click so your team can publish with confidence." },
  { icon: "🎯", title: "ICP-aligned keyword targeting", desc: "Filter keywords by the exact buyer intent that matches your ICP. Stop attracting traffic that never converts." },
  { icon: "🔍", title: "Monitor competitors weekly", desc: "Get alerts when competitors rank for new keywords. React before they've fully established their position." },
];

export default function StartupsPage() {
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
          <span className="ubk-dot" /> For Startups
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Build organic traffic<br />
          <span className="ubk-orange-accent">before you run out of runway</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
          Startups that own SEO early win long-term. UnboundKeyword helps you find the keywords your ICP is already searching — and rank for them before your competitors do.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/register" className="ubk-btn-primary font-black px-10 py-4 rounded-full text-base">Start Free Trial</Link>
          <Link href="/pricing" className="border border-white/20 text-white/80 hover:text-white font-bold px-10 py-4 rounded-full text-base transition">See pricing</Link>
        </div>
        <p className="text-white/30 text-sm mt-6">No credit card required · Cancel anytime</p>
      </section>

      {/* Pain points */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-black text-center mb-10">Startup SEO challenges, <span className="ubk-orange-accent">solved</span></h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {PAIN_POINTS.map((p) => (
            <div key={p.pain} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-red-400 text-lg mt-0.5 shrink-0">✗</span>
                <p className="text-white/50 text-sm">{p.pain}</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 text-lg mt-0.5 shrink-0">✓</span>
                <p className="text-white/80 text-sm font-medium">{p.fix}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">Built for startups moving fast</h2>
        <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">Every feature is designed for teams that need to move fast, prove ROI, and build compounding growth — not SEO agencies who charge by the hour.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STARTUP_BENEFITS.map((b) => (
            <div key={b.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 hover:border-[#f15b27]/40 transition-colors">
              <div className="text-3xl mb-3">{b.icon}</div>
              <h3 className="font-black text-lg mb-2">{b.title}</h3>
              <p className="text-white/55 text-sm leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Metrics highlight */}
      <section className="max-w-3xl mx-auto px-6 pb-20 text-center">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10">
          <p className="text-white/50 text-sm uppercase tracking-widest font-bold mb-6">The compounding SEO advantage</p>
          <div className="grid grid-cols-3 gap-6">
            {[
              { n: "Month 1", stat: "Keyword map built" },
              { n: "Month 3", stat: "First pages ranking" },
              { n: "Month 6", stat: "Organic > paid traffic" },
            ].map((m) => (
              <div key={m.n}>
                <div className="text-xl font-black ubk-orange-accent mb-1">{m.n}</div>
                <div className="text-white/60 text-xs">{m.stat}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-4xl font-black mb-4">SEO is a startup&apos;s best <span className="ubk-orange-accent">long-term bet</span></h2>
        <p className="text-white/55 text-lg mb-8">Start building keyword authority on day one. The startups that win at SEO now will have a moat their competitors can&apos;t buy their way into.</p>
        <Link href="/register" className="ubk-btn-primary font-black px-12 py-5 rounded-full text-lg inline-block">Start Free Trial</Link>
        <p className="text-white/30 text-sm mt-4">14-day free trial · No credit card required</p>
      </section>

      <MarketingFooter />
    </main>
  );
}
