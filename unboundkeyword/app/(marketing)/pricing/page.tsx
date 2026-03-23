"use client";

import Link from "next/link";

const CHECK = <span className="text-[#f97316] text-base shrink-0">✓</span>;
const DASH  = <span className="text-white/25 shrink-0">–</span>;

const PLANS = [
  {
    name: "Free",
    price: "$0",
    tagline: "For testing and light personal use",
    popular: false,
    cta: "Create free account",
    ctaHref: "/register?plan=free",
    features: [
      "1 user seat",
      "1 project · 1 domain",
      "10 keyword hunts / month",
      "120 keyword lookups / month",
      "2 keyword lists",
      "200 saved keywords",
      "CSV export",
      "Community support",
    ],
    missing: [
      "Local keyword research",
      "Intent analysis",
      "Google Sheets export",
      "API access",
    ],
  },
  {
    name: "Solo",
    price: "$25",
    tagline: "For bloggers, freelancers & side projects",
    popular: false,
    cta: "Start free trial",
    ctaHref: "/register?plan=solo",
    features: [
      "1 user seat",
      "1 project · 1 domain",
      "25 keyword hunts / month",
      "300 keyword lookups / month",
      "5 keyword lists",
      "500 saved keywords",
      "CSV export",
      "Email support",
    ],
    missing: [
      "Local keyword research",
      "Intent analysis",
      "Google Sheets export",
      "API access",
    ],
  },
  {
    name: "Growth",
    price: "$49",
    tagline: "For consultants & small agencies",
    popular: true,
    cta: "Start free trial",
    ctaHref: "/register?plan=growth",
    features: [
      "3 user seats",
      "2 projects · 2 domains",
      "75 keyword hunts / month",
      "1,000 keyword lookups / month",
      "20 keyword lists",
      "2,000 saved keywords",
      "CSV + Google Sheets export",
      "Local keyword research",
      "Intent analysis",
      "Priority email support",
    ],
    missing: [
      "API access",
    ],
  },
  {
    name: "Agency",
    price: "$99",
    tagline: "For agencies managing multiple clients",
    popular: false,
    cta: "Start free trial",
    ctaHref: "/register?plan=agency",
    features: [
      "10 user seats",
      "5 projects · 5 domains",
      "200 keyword hunts / month",
      "3,000 keyword lookups / month",
      "Unlimited keyword lists",
      "10,000 saved keywords",
      "CSV + bulk export",
      "All Growth features",
      "API access",
      "Dedicated support",
    ],
    missing: [],
  },
];

export default function PricingPage() {
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
          Pricing
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Affordable keyword research<br />
          <span className="ubk-orange-accent">at any scale</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-4">
          Start free or scale from $25/mo. No hidden fees, no per-seat surprises. Cancel anytime.
        </p>
        <p className="text-white/40 text-sm">Free account available · 14-day free trial on all paid plans · No credit card required</p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 flex flex-col relative ${
                plan.popular
                  ? "bg-slate-900/70 border border-[rgba(241,91,39,0.45)] md:scale-105 md:z-10"
                  : "bg-slate-900/40 border border-white/[0.07]"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap shadow-lg">
                    ⭐ Most Popular
                  </div>
                </div>
              )}

              <div className={plan.popular ? "mt-4" : ""}>
                <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                <p className="text-white/55 text-sm mb-6">{plan.tagline}</p>
              </div>

              <div className="mb-8">
                <div className="text-4xl font-black mb-1">
                  {plan.price}
                  <span className="text-lg text-white/55 font-normal">/month</span>
                </div>
                <p className="text-white/40 text-xs">{plan.name === "Free" ? "No credit card required" : "Save 20% billed annually"}</p>
              </div>

              <ul className="space-y-2.5 mb-8 flex-grow">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    {CHECK}
                    <span className="text-white/80 text-sm">{f}</span>
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    {DASH}
                    <span className="text-white/30 text-sm">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`w-full text-center font-bold py-3 rounded-full text-sm block transition ${
                  plan.popular
                    ? "ubk-btn-primary"
                    : "border border-white/20 text-white/80 hover:border-[rgba(241,91,39,0.5)] hover:text-white"
                }`}
              >
                {plan.cta}
              </Link>
              <p className="text-white/30 text-xs text-center mt-3">{plan.name === "Free" ? "Use free forever with monthly limits" : "14-day free trial · No card needed"}</p>
            </div>
          ))}
        </div>

        {/* Enterprise add-on */}
        <div className="mt-6 rounded-2xl p-8 bg-slate-900/30 border border-white/[0.05] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-1">Enterprise</h3>
            <p className="text-white/55 text-sm max-w-xl">
              High-volume teams, white-label options, custom integrations, SLA, invoicing, and onboarding. We&apos;ll build a plan around your workflow.
            </p>
          </div>
          <div className="shrink-0">
            <Link href="mailto:hello@unboundkeyword.com" className="ubk-btn-primary font-bold px-8 py-3 rounded-full text-sm inline-block">
              Talk to us
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-12 text-center">What&apos;s included</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-4 font-semibold text-white/60 w-1/2">Feature</th>
                <th className="text-center py-4 font-bold text-white/80">Solo</th>
                <th className="text-center py-4 font-bold text-[#f97316]">Growth</th>
                <th className="text-center py-4 font-bold text-white/80">Agency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {[
                ["Keyword hunts / mo", "25", "75", "200"],
                ["Keyword lookups / mo", "300", "1,000", "3,000"],
                ["Saved keywords", "500", "2,000", "10,000"],
                ["Keyword lists", "5", "20", "Unlimited"],
                ["Projects / domains", "1 / 1", "2 / 2", "5 / 5"],
                ["User seats", "1", "3", "10"],
              ].map(([label, solo, growth, agency]) => (
                <tr key={label}>
                  <td className="py-3.5 text-white/70">{label}</td>
                  <td className="text-center text-white/55">{solo}</td>
                  <td className="text-center text-white/80 font-medium">{growth}</td>
                  <td className="text-center text-white/55">{agency}</td>
                </tr>
              ))}
              {[
                ["Question discovery (PAA)", true, true, true],
                ["A–Z autocomplete explorer", true, true, true],
                ["Intent analysis", false, true, true],
                ["Local keyword research", false, true, true],
                ["CSV export", true, true, true],
                ["Google Sheets export", false, true, true],
                ["Bulk export", false, false, true],
                ["GSC integration", false, true, true],
                ["API access", false, false, true],
              ].map(([label, solo, growth, agency]) => (
                <tr key={label as string}>
                  <td className="py-3.5 text-white/70">{label}</td>
                  <td className="text-center">{solo ? <span className="text-[#f97316]">✓</span> : <span className="text-white/20">–</span>}</td>
                  <td className="text-center">{growth ? <span className="text-[#f97316]">✓</span> : <span className="text-white/20">–</span>}</td>
                  <td className="text-center">{agency ? <span className="text-[#f97316]">✓</span> : <span className="text-white/20">–</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* What counts as a "keyword hunt"? */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="bg-slate-900/40 border border-white/[0.07] rounded-2xl p-8">
          <h3 className="text-lg font-bold mb-4">What counts as a keyword hunt?</h3>
          <p className="text-white/60 text-sm leading-relaxed mb-3">
            A <strong className="text-white/90">keyword hunt</strong> is one full research session on a topic — it pulls questions, autocomplete data, related phrases, A–Z variations, and search volume for every result. This is the deep-dive mode.
          </p>
          <p className="text-white/60 text-sm leading-relaxed">
            A <strong className="text-white/90">keyword lookup</strong> checks metrics (volume, competition, trends) for individual keywords you already have. These are lightweight and use less of your monthly quota.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 pb-16 border-t border-white/[0.06] pt-16">
        <h2 className="text-3xl font-bold mb-12 text-center">Questions &amp; Answers</h2>
        <div className="space-y-5">
          {[
            ["Can I try before I buy?", "Yes — all paid plans include a 14-day free trial. No credit card required. You can also use the free tier indefinitely with limited searches."],
            ["Can I upgrade or downgrade anytime?", "Absolutely. Changes take effect at your next billing cycle. Upgrades are prorated so you only pay the difference."],
            ["What happens if I hit my monthly limit?", "We'll notify you when you're approaching your limit. You can upgrade immediately or wait for the reset. Your existing lists and saved keywords are never deleted."],
            ["Can I use this for client work?", "Yes. The Growth and Agency plans are built for client work with multiple projects and domains. Each project keeps client data fully separate."],
            ["Do you offer annual billing discounts?", "Yes — pay annually and save 20% on any plan. Your rate is locked for the year."],
            ["What&apos;s your refund policy?", "If you&apos;ve been with us 30 days or less and aren&apos;t satisfied, just ask and we&apos;ll refund in full."],
          ].map(([q, a]) => (
            <div key={q as string} className="bg-slate-900/30 rounded-xl p-6 border border-white/[0.05]">
              <h3 className="font-bold mb-2 text-white">{q}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <div className="ubk-cta-banner rounded-3xl p-10 md:p-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Start at <span className="ubk-orange-accent">$25/month</span>
          </h2>
          <p className="text-white/55 mb-8">No credit card required. Cancel anytime. Built for real keyword researchers.</p>
          <Link href="/register" className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full inline-block">
            Start your free trial
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
