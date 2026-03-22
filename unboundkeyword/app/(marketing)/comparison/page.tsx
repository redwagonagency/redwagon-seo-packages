"use client";

import Link from "next/link";

const O = <span className="text-[#f97316] font-bold">✓</span>;
const X = <span className="text-white/20">–</span>;
const S = (v: string) => <span className="text-white/70 text-xs">{v}</span>;

const ROWS: [string, React.ReactNode, React.ReactNode, React.ReactNode, React.ReactNode, React.ReactNode, React.ReactNode][] = [
  ["Starting price", S("$25/mo"), S("$12/mo"), S("$99/mo"), S("$120/mo"), S("$99/mo"), S("$55/mo")],
  ["Keyword research focus", O, O, X, X, X, X],
  ["Question / PAA discovery", O, X, X, X, X, X],
  ["A–Z autocomplete explorer", O, X, X, X, X, X],
  ["Multi-platform search\n(Google, YouTube, Amazon…)", O, X, X, X, X, X],
  ["Local keywords by city", O, X, O, O, X, O],
  ["AI / LLM visibility check", O, X, X, X, X, X],
  ["Topic clustering", O, X, X, X, X, X],
  ["Intent classification", O, X, O, O, X, O],
  ["Google Sheets export", O, X, X, X, O, O],
  ["Save to keyword lists", O, O, O, O, O, O],
  ["Free plan available", O, O, X, X, X, X],
];

export default function ComparisonPage() {
  return (
    <main className="ubk-bg min-h-screen text-white">
      {/* Nav */}
      <nav className="relative z-30 flex items-center justify-between px-6 md:px-10 py-4 max-w-7xl mx-auto">
        <Link href="/" className="text-lg font-black tracking-tight ubk-logo">
          Unbound<span className="text-white/50">Keyword</span>
        </Link>
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
        <div className="ubk-badge inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-6">
          Keyword Tool Comparison
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          The keyword research tool<br />
          <span className="ubk-orange-accent">built for depth</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto">
          Most tools bolt keyword research onto a platform. We built for it from scratch.
          See exactly how UnboundKeyword compares.
        </p>
      </section>

      {/* Comparison Table */}
      <section className="max-w-7xl mx-auto px-6 py-8 pb-16">
        <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900/60 border-b border-white/[0.07]">
                <th className="text-left py-4 px-5 font-semibold text-white/50 w-56">Feature</th>
                <th className="text-center py-4 px-4 font-bold text-[#f97316] bg-[rgba(241,91,39,0.06)]">
                  <div>UnboundKeyword</div>
                  <div className="text-xs font-normal text-[#f97316]/70 mt-0.5">from $25/mo</div>
                </th>
                <th className="text-center py-4 px-4 font-semibold text-white/75">
                  <div>Ubersuggest</div>
                  <div className="text-xs font-normal text-white/40 mt-0.5">from $12/mo</div>
                </th>
                <th className="text-center py-4 px-4 font-semibold text-white/75">
                  <div>Ahrefs</div>
                  <div className="text-xs font-normal text-white/40 mt-0.5">from $99/mo</div>
                </th>
                <th className="text-center py-4 px-4 font-semibold text-white/75">
                  <div>SEMrush</div>
                  <div className="text-xs font-normal text-white/40 mt-0.5">from $120/mo</div>
                </th>
                <th className="text-center py-4 px-4 font-semibold text-white/75">
                  <div>Moz</div>
                  <div className="text-xs font-normal text-white/40 mt-0.5">from $99/mo</div>
                </th>
                <th className="text-center py-4 px-4 font-semibold text-white/75">
                  <div>SE Ranking</div>
                  <div className="text-xs font-normal text-white/40 mt-0.5">from $55/mo</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, ubk, ub, ah, sem, moz, ser], i) => (
                <tr key={i} className="border-b border-white/[0.05] hover:bg-white/[0.02] transition">
                  <td className="py-3.5 px-5 text-white/70 whitespace-pre-line text-xs leading-snug">{label}</td>
                  <td className="text-center py-3.5 px-4 bg-[rgba(241,91,39,0.03)]">{ubk}</td>
                  <td className="text-center py-3.5 px-4">{ub}</td>
                  <td className="text-center py-3.5 px-4">{ah}</td>
                  <td className="text-center py-3.5 px-4">{sem}</td>
                  <td className="text-center py-3.5 px-4">{moz}</td>
                  <td className="text-center py-3.5 px-4">{ser}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-white/30 text-xs text-center mt-3">
          Comparison based on publicly available feature listings. Prices as of 2025.
        </p>
      </section>

      {/* Why keyword-first matters */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-8 text-center">Why keyword-first wins</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/40 rounded-2xl p-7 border border-white/[0.06]">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="font-bold text-lg mb-2">Depth, not breadth</h3>
            <p className="text-white/55 text-sm leading-relaxed">
              When a tool tries to do everything — backlinks, audits, rank tracking, PPC — keyword research becomes an afterthought. UnboundKeyword does one thing and does it 10x deeper.
            </p>
          </div>
          <div className="bg-slate-900/40 rounded-2xl p-7 border border-white/[0.06]">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="font-bold text-lg mb-2">$25 vs $99–$120</h3>
            <p className="text-white/55 text-sm leading-relaxed">
              All-in-one tools charge $99–$120/mo minimum because you&apos;re paying for features you&apos;ll never use. UnboundKeyword keeps it lean and affordable without compromising on keyword quality.
            </p>
          </div>
          <div className="bg-slate-900/40 rounded-2xl p-7 border border-white/[0.06]">
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="font-bold text-lg mb-2">Questions &amp; PAA no one else has</h3>
            <p className="text-white/55 text-sm leading-relaxed">
              The &ldquo;People Also Ask&rdquo; data we surface goes 500+ questions deep per topic. Every how, what, why, where &amp; when your audience types — across every major platform.
            </p>
          </div>
        </div>
      </section>

      {/* SearchAuditPro Advertisement */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="rounded-2xl border border-[rgba(241,91,39,0.3)] bg-gradient-to-br from-[rgba(241,91,39,0.08)] to-[rgba(249,115,22,0.02)] p-8 md:p-10">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-[rgba(241,91,39,0.15)] border border-[rgba(241,91,39,0.3)] rounded-full px-3 py-1 text-xs font-semibold text-[#f97316] mb-4">
                🤝 Companion Tool
              </div>
              <h3 className="text-2xl font-black mb-3">
                Need full SEO beyond keywords?
                <br />
                <span className="ubk-orange-accent">Meet SearchAuditPro.com</span>
              </h3>
              <p className="text-white/65 text-sm leading-relaxed mb-4">
                UnboundKeyword finds the keywords. <strong className="text-white/90">SearchAuditPro</strong> helps you rank for them.
                At just $25/mo, get site audit, rank tracking, on-page optimization, off-page analysis, and
                LLM visibility reporting — the full SEO workflow at a startup-friendly price.
              </p>
              <ul className="space-y-1.5 text-sm text-white/70 mb-6">
                <li className="flex items-center gap-2"><span className="text-[#f97316]">✓</span> Site audit &amp; technical SEO health</li>
                <li className="flex items-center gap-2"><span className="text-[#f97316]">✓</span> Rank tracking across Google &amp; Bing</li>
                <li className="flex items-center gap-2"><span className="text-[#f97316]">✓</span> On-page &amp; off-page optimization scoring</li>
                <li className="flex items-center gap-2"><span className="text-[#f97316]">✓</span> LLM / AI visibility monitoring (ChatGPT, Gemini, etc.)</li>
                <li className="flex items-center gap-2"><span className="text-[#f97316]">✓</span> Export your UnboundKeyword lists directly into SearchAuditPro</li>
              </ul>
              <p className="text-white/40 text-xs">Both tools together = $50/mo for the complete keyword-to-ranking SEO stack. No bloated all-in-one required.</p>
            </div>
            <div className="shrink-0 text-center">
              <a
                href="https://searchauditpro.com"
                target="_blank"
                rel="noopener noreferrer"
                className="ubk-btn-primary font-bold px-8 py-4 rounded-full inline-block text-sm whitespace-nowrap"
              >
                Visit SearchAuditPro →
              </a>
              <p className="text-white/35 text-xs mt-2">$25/mo · 14-day free trial</p>
            </div>
          </div>
        </div>
      </section>

      {/* When to use each */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-10 text-center">When to choose what</h2>
        <div className="space-y-4">
          <div className="bg-slate-900/30 rounded-xl p-6 border border-[rgba(241,91,39,0.2)]">
            <h3 className="font-bold text-[#f97316] mb-3">Choose UnboundKeyword when:</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-white/75">
              <li>• Keyword research is your primary workflow</li>
              <li>• You want questions + autocomplete + PAA at scale</li>
              <li>• You&apos;re targeting local markets (city-level keywords)</li>
              <li>• You serve content creators, bloggers, or copywriters</li>
              <li>• Budget is limited — $25 vs $99+ elsewhere</li>
              <li>• You need multi-platform keyword data (not just Google)</li>
            </ul>
          </div>
          <div className="bg-slate-900/30 rounded-xl p-6 border border-white/[0.05]">
            <h3 className="font-bold text-white/60 mb-3">Consider Ubersuggest when:</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-white/55">
              <li>• You need the absolute lowest price entry point ($12/mo)</li>
              <li>• Basic keyword ideas and content suggestions are enough</li>
              <li>• You&apos;re just getting started with SEO</li>
            </ul>
          </div>
          <div className="bg-slate-900/30 rounded-xl p-6 border border-white/[0.05]">
            <h3 className="font-bold text-white/60 mb-3">Consider Ahrefs / SEMrush when:</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-white/55">
              <li>• You need deep backlink analysis (competitor link profiles)</li>
              <li>• Daily rank tracking across 100s of keywords is required</li>
              <li>• Technical site audits are a core part of your offering</li>
              <li>• Budget allows $99–$120+/mo and you&apos;ll use all features</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Cost section */}
      <section className="max-w-5xl mx-auto px-6 pb-16 border-t border-white/[0.06] pt-16">
        <h2 className="text-3xl font-bold mb-10 text-center">Annual cost reality check</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "UnboundKeyword", price: "$240", sub: "Solo plan  ($25/mo × 12 — 20% off annual)", color: "from-[rgba(241,91,39,0.12)]" },
            { name: "Ubersuggest", price: "$144", sub: "Individual ($12/mo)", color: "from-white/[0.03]" },
            { name: "SE Ranking", price: "$660", sub: "Essential plan ($55/mo)", color: "from-white/[0.03]" },
            { name: "Ahrefs / SEMrush", price: "$1,188+", sub: "Lite plan ($99+/mo)", color: "from-white/[0.03]" },
          ].map((t) => (
            <div key={t.name} className={`bg-gradient-to-b ${t.color} to-transparent rounded-xl p-5 border border-white/[0.07]`}>
              <div className="text-2xl font-black mb-1">{t.price}</div>
              <div className="text-sm font-semibold mb-1 text-white/90">{t.name}</div>
              <div className="text-xs text-white/40">{t.sub}</div>
            </div>
          ))}
        </div>
        <p className="text-center text-white/50 text-sm mt-6">
          For keyword-focused use cases: UnboundKeyword + SearchAuditPro together = <strong className="text-white/80">$600/year</strong> vs Ahrefs/SEMrush at $1,200+. Same depth, half the price.
        </p>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <div className="ubk-cta-banner rounded-3xl p-10 md:p-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            The keyword research tool<br />
            <span className="ubk-orange-accent">built to go deeper</span>
          </h2>
          <p className="text-white/55 mb-8">Start free. No credit card. Discover keywords your competitors haven&apos;t found.</p>
          <Link href="/register" className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full inline-block">
            Try it free
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
