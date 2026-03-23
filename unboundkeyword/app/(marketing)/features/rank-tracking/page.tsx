"use client";

import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const CAPABILITIES = [
  { icon: "📊", title: "Daily rank updates", desc: "Fresh rank data every day for all your tracked keywords — so you see position changes the moment they happen, not at the end of the week." },
  { icon: "🌍", title: "Multi-location tracking", desc: "Track rankings in specific cities, states, countries, or device types. Know your local pack position separately from your organic rank." },
  { icon: "🔔", title: "Position change alerts", desc: "Get instant notifications when you gain or lose significant positions. React to ranking drops before they become traffic drops." },
  { icon: "📈", title: "Share of voice tracking", desc: "Measure your visibility across your full keyword set — not just individual rankings. See your total market share growing month over month." },
  { icon: "🏆", title: "SERP feature tracking", desc: "Track when you earn or lose featured snippets, PAA boxes, image packs, and other SERP features — where most additional traffic actually comes from." },
  { icon: "📋", title: "Scheduled reports", desc: "Automated weekly or monthly rank reports delivered to your inbox or your client&apos;s — with trend charts and position change summaries." },
  { icon: "🆚", title: "Competitor rank comparison", desc: "See your rankings vs. competitors side by side for every keyword. Know when they move up and when you have a chance to take their position." },
  { icon: "📉", title: "Cannibalization detection", desc: "Automatically flags when multiple pages on your site are competing for the same keyword — before it tanks both pages&apos; rankings." },
];

export default function RankTrackingFeaturePage() {
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
          <span className="ubk-dot" /> Feature: Rank Tracking
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Know your rankings<br />
          <span className="ubk-orange-accent">before your clients ask</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
          Daily rank tracking with position change alerts, SERP feature monitoring, and automated reporting — so you&apos;re always ahead of what&apos;s happening in search.
        </p>
        <Link href="/pricing" className="ubk-btn-primary font-black px-10 py-4 rounded-full text-base inline-block">Start Tracking Free</Link>
        <p className="text-white/30 text-sm mt-4">Track up to 50 keywords free · No credit card required</p>
      </section>

      {/* Rank position preview mockup */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-xs text-white/40 uppercase tracking-wider font-bold mb-4">Keyword Rankings</div>
          <div className="space-y-3">
            {[
              { kw: "best keyword research tool", prev: 14, curr: 6, delta: -8 },
              { kw: "seo keyword finder free", prev: 8, curr: 3, delta: -5 },
              { kw: "keyword research software", prev: 22, curr: 11, delta: -11 },
              { kw: "long tail keyword tool", prev: 4, curr: 4, delta: 0 },
            ].map((r) => (
              <div key={r.kw} className="flex items-center justify-between text-sm py-2 border-b border-white/[0.06] last:border-0">
                <span className="text-white/70 flex-1">{r.kw}</span>
                <span className="text-white/40 mr-4 text-xs">was #{r.prev}</span>
                <span className="font-black text-base w-8 text-right">{r.curr}</span>
                <span className={`ml-3 text-xs font-bold w-12 text-right ${r.delta < 0 ? "text-emerald-400" : r.delta > 0 ? "text-red-400" : "text-white/30"}`}>
                  {r.delta < 0 ? `▲${Math.abs(r.delta)}` : r.delta > 0 ? `▼${r.delta}` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-black text-center mb-4">Everything you need to track rankings properly</h2>
        <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">Daily updates, multi-location tracking, SERP feature monitoring, and automated reports — rank tracking that actually tells you what to do next.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:border-[#f15b27]/40 transition-colors">
              <div className="text-2xl mb-3">{c.icon}</div>
              <h3 className="font-black text-base mb-2">{c.title}</h3>
              <p className="text-white/50 text-xs leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-4xl font-black mb-4">Rankings are moving <span className="ubk-orange-accent">right now</span></h2>
        <p className="text-white/55 text-lg mb-8">Don&apos;t find out about ranking drops from an angry client. Set up rank tracking today and get alerts the moment anything changes.</p>
        <Link href="/pricing" className="ubk-btn-primary font-black px-12 py-5 rounded-full text-lg inline-block">Start Free Trial</Link>
        <p className="text-white/30 text-sm mt-4">14-day free trial · No credit card required</p>
      </section>

      <MarketingFooter />
    </main>
  );
}
