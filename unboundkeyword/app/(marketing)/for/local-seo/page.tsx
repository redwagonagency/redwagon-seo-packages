"use client";

import Link from "next/link";

const LOCAL_VERTICALS = [
  ["🔧", "Home Services", "plumber, HVAC, electrician, cleaning"],
  ["🦷", "Healthcare & Dental", "chiropractor, dermatologist, dental"],
  ["⚖️", "Legal Services", "personal injury attorney, family law"],
  ["🏠", "Real Estate", "realtor, property management, rentals"],
  ["🍽️", "Restaurants & Food", "catering, food delivery, meal prep"],
  ["💆", "Beauty & Wellness", "salon, spa, massage therapist"],
  ["🏋️", "Fitness & Sports", "personal trainer, yoga studio, gym"],
  ["🐾", "Pet Services", "veterinarian, dog groomer, pet sitter"],
];

export default function ForLocalSEO() {
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
          <Link href="/pricing" className="ubk-btn-primary text-sm font-bold px-5 py-2 rounded-full">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 py-20 max-w-5xl mx-auto text-center">
        <div className="ubk-badge inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-6">
          For Local SEO
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          City-level keyword research<br />
          <span className="ubk-orange-accent">at scale</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
          Stop doing local keyword research one city at a time. UnboundKeyword surfaces
          geo-targeted keywords for every service area in minutes — not weeks.
        </p>
        <Link href="/pricing" className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full inline-block">
          Start local keyword research
        </Link>
      </section>

      {/* The local keyword problem */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="bg-slate-900/40 border border-white/[0.07] rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-4">The problem with local keyword research</h3>
          <p className="text-white/65 text-sm leading-relaxed mb-4">
            Traditional keyword tools give you &ldquo;plumber near me&rdquo; and &ldquo;plumber [city]&rdquo;. That&apos;s not local keyword research — that&apos;s a template.
          </p>
          <p className="text-white/65 text-sm leading-relaxed mb-4">
            Real local keyword research means understanding what people in <strong className="text-white/85">Houston</strong> type vs. what they type in
            <strong className="text-white/85"> Chicago</strong>. It means knowing that &ldquo;emergency plumber open now&rdquo; has 4,200 searches in Phoenix but 800 in Tucson.
            It means finding the specific service + location + modifier combinations that convert.
          </p>
          <p className="text-white/65 text-sm leading-relaxed">
            UnboundKeyword performs location-scoped searches to pull real autocomplete, PAA, and keyword data
            as if you&apos;re searching from that specific city or region. You get local keyword reality, not national averages.
          </p>
        </div>
      </section>

      {/* How it works for local */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-10 text-center">Local keyword research, rethought</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            ["📍", "Location-scoped keyword data", "Search for keywords as if you&apos;re in a specific city, state, or DMA. See the exact autocomplete suggestions and PAA questions Google returns for that location."],
            ["🗺️", "Multi-location scaling", "Running SEO for a business in 20 cities? Uncover the keyword variations across each location in a fraction of the time. One session, many markets."],
            ["❓", "Local question discovery", "Find every question local customers ask before choosing a service provider. &ldquo;How much does [service] cost in [city]&rdquo;, &ldquo;best [service] near [neighborhood]&rdquo;."],
            ["🏆", "Local landing page keyword maps", "For each service-city combination, build a complete keyword map for the landing page: primary keyword, secondary keywords, headings, FAQs, schema questions."],
            ["📈", "Volume benchmarking by market", "See whether a local market is worth targeting before investing. Compare search volume between cities to prioritize expansion."],
            ["🔁", "Consistent local content coverage", "Use the keyword data to build consistent service pages across every city — same structure, different local keyword flavor."],
          ].map(([icon, title, desc]) => (
            <div key={title as string} className="bg-slate-900/30 border border-white/[0.05] rounded-xl p-6 flex gap-4">
              <div className="text-xl shrink-0">{icon}</div>
              <div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-white/55 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Multi-location agency workflow */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-3 text-center">Multi-location agency workflow</h2>
        <p className="text-center text-white/50 mb-10 text-sm">Scale local keyword research across dozens of locations.</p>
        <div className="space-y-4">
          {[
            ["Define service-location pairs", "List every service (plumbing, drain repair, water heater) × every city (Houston, The Woodlands, Sugar Land). This is your research matrix."],
            ["Run bulk local keyword discovery", "Enter each pair into UnboundKeyword&apos;s local keywords tool with the city/state scoped. Get questions, autocomplete chains, and volume for each combo."],
            ["Identify the highest-value targets", "Sort by volume and intent. Cherry-pick the service-location combos with the best conversion potential vs. competition ratio."],
            ["Build keyword maps per page", "For each landing page: one primary keyword, 3–5 secondary, 10 FAQs from the question data, and the schema markup language."],
            ["Export and brief writers", "Export keyword maps to CSV or Google Sheets. Assign to writers with clear briefs. Each page gets done right the first time."],
          ].map(([step, desc]) => (
            <div key={step as string} className="flex gap-4">
              <span className="text-[#f97316] shrink-0 mt-1">→</span>
              <div className="border-b border-white/[0.05] pb-4 mb-1 flex-1">
                <h3 className="font-semibold mb-1">{step}</h3>
                <p className="text-white/55 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Verticals */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Works for every local vertical</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {LOCAL_VERTICALS.map(([icon, name, examples]) => (
            <div key={name as string} className="bg-slate-900/30 border border-white/[0.05] rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="font-semibold text-sm mb-1">{name}</div>
              <div className="text-white/35 text-xs">{examples}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Quote */}
      <section className="max-w-3xl mx-auto px-6 pb-16 text-center">
        <blockquote className="text-lg text-white/75 italic leading-relaxed mb-4">
          &ldquo;We were doing local keyword research for 60-city campaigns using spreadsheets and three different tools.
          UnboundKeyword replaced all of it. The location-scoped data is genuinely different from what national keyword
          tools show — and it converts better.&rdquo;
        </blockquote>
        <p className="text-white/90 font-bold">Derek Hall</p>
        <p className="text-white/45 text-sm">Head of Local SEO, Multi-Location Agency</p>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <div className="ubk-cta-banner rounded-3xl p-10 md:p-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Own your local market with<br />
            <span className="ubk-orange-accent">real city-level keywords</span>
          </h2>
          <p className="text-white/55 mb-8">Free trial — no credit card required.</p>
          <Link href="/pricing" className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full inline-block">
            Start local keyword research
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
