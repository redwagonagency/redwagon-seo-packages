"use client";

import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const PAIN_POINTS = [
  {
    pain: "Can't compete with big brands on head terms",
    fix: "We surface the long-tail and local keywords that big brands ignore — where you can rank page 1 without a huge budget.",
  },
  {
    pain: "No idea which keywords bring paying customers",
    fix: "Revenue-intent filtering shows you keywords with buyer signals — separate the window-shoppers from the wallet-openers.",
  },
  {
    pain: "Spending money on ads you can't afford indefinitely",
    fix: "Organic SEO driven by the right keywords creates traffic that doesn't disappear when your budget runs out.",
  },
  {
    pain: "Trying to figure out why competitors rank higher",
    fix: "Full competitor keyword gap analysis tells you exactly what they have that you don't — and a plan to bridge the gap.",
  },
];

const WORKFLOW = [
  { n: "1", title: "Add your business", desc: "Connect your website and tell us your industry and target locations. We build your baseline keyword profile in minutes." },
  { n: "2", title: "Find your best opportunities", desc: "Our smart filters surface keywords where you can realistically rank — high enough volume to matter, low enough competition to win." },
  { n: "3", title: "Build pages that rank", desc: "Get page-by-page recommendations: which keywords to target, what content to write, and how to structure it to beat whoever's currently ranking." },
  { n: "4", title: "Track and grow", desc: "Monitor your rankings week over week. See the traffic curve move. Know exactly which keywords are driving real business." },
];

export default function SmallBusinessPage() {
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
          <span className="ubk-dot" /> For Small Businesses
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Small business SEO that<br />
          <span className="ubk-orange-accent">punches above its weight</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
          You don&apos;t need an agency budget or a full-time SEO team. UnboundKeyword finds the exact keywords your customers are searching — and tells you exactly what to do.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/register" className="ubk-btn-primary font-black px-10 py-4 rounded-full text-base">Start Free Trial</Link>
          <Link href="/pricing" className="border border-white/20 text-white/80 hover:text-white font-bold px-10 py-4 rounded-full text-base transition">See pricing</Link>
        </div>
        <p className="text-white/30 text-sm mt-6">No credit card required · Cancel anytime</p>
      </section>

      {/* Pain points */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-black text-center mb-10">The small business SEO struggle is real. <span className="ubk-orange-accent">We fix it.</span></h2>
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

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-black text-center mb-4">Go from zero to ranking in 4 steps</h2>
        <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">No SEO expertise required. We guide you from keyword research to ranking — step by step.</p>
        <div className="space-y-6">
          {WORKFLOW.map((w) => (
            <div key={w.n} className="flex gap-6 items-start rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-4xl font-black ubk-orange-accent shrink-0 leading-none">{w.n}</div>
              <div>
                <h3 className="font-black text-xl mb-2">{w.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof highlight */}
      <section className="max-w-3xl mx-auto px-6 pb-20 text-center">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10">
          <div className="text-5xl font-black ubk-orange-accent mb-2">3×</div>
          <div className="text-xl font-black mb-3">more organic traffic</div>
          <p className="text-white/55 text-sm max-w-sm mx-auto">Average traffic increase reported by small business owners in their first 90 days using UnboundKeyword&apos;s keyword recommendations.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-4xl font-black mb-4">Your customers are searching. <span className="ubk-orange-accent">Be there when they do.</span></h2>
        <p className="text-white/55 text-lg mb-8">Start finding the keywords that grow your business — without needing an agency, a big budget, or an SEO degree.</p>
        <Link href="/register" className="ubk-btn-primary font-black px-12 py-5 rounded-full text-lg inline-block">Start Free Trial</Link>
        <p className="text-white/30 text-sm mt-4">14-day free trial · No credit card required</p>
      </section>

      <MarketingFooter />
    </main>
  );
}
