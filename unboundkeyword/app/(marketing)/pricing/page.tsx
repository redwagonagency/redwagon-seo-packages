"use client";

import Link from "next/link";

export default function PricingPage() {
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
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Simple, transparent <span className="ubk-orange-accent">pricing</span>
        </h1>
        <p className="text-white/60 text-lg max-w-3xl mx-auto">
          No surprises. Scale as you grow. Cancel anytime.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter */}
          <div className="bg-slate-900/40 rounded-2xl p-8 border border-white/[0.06] flex flex-col">
            <h3 className="text-2xl font-bold mb-1">Starter</h3>
            <p className="text-white/60 text-sm mb-6">For solo professionals and small projects</p>

            <div className="mb-8">
              <div className="text-4xl font-black mb-2">
                $49<span className="text-lg text-white/60">/month</span>
              </div>
              <p className="text-white/50 text-sm">Billed monthly or save 20% with annual</p>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex gap-3">
                <span className="text-[#f97316] text-lg shrink-0">✓</span>
                <span className="text-white/80 text-sm">100k searches/month</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#f97316] text-lg shrink-0">✓</span>
                <span className="text-white/80 text-sm">5 keyword lists</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#f97316] text-lg shrink-0">✓</span>
                <span className="text-white/80 text-sm">Basic filters & sorting</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#f97316] text-lg shrink-0">✓</span>
                <span className="text-white/80 text-sm">CSV exports</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#f97316] text-lg shrink-0">✓</span>
                <span className="text-white/80 text-sm">Email support</span>
              </li>
            </ul>

            <Link href="/register?plan=starter" className="ubk-btn-primary w-full text-center font-bold py-3 rounded-full text-sm">
              Start free trial
            </Link>
            <p className="text-white/40 text-xs text-center mt-3">No credit card required</p>
          </div>

          {/* Professional (Popular) */}
          <div className="bg-slate-900/60 rounded-2xl p-8 border border-[rgba(241,91,39,0.35)] flex flex-col relative md:scale-105 md:z-10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="ubk-badge inline-flex items-center gap-2 bg-gradient-to-r from-[#f97316] to-[#fb923c]">
                <span>⭐ Most Popular</span>
              </div>
            </div>

            <h3 className="text-2xl font-bold mb-1 mt-4">Professional</h3>
            <p className="text-white/60 text-sm mb-6">For agencies and growing teams</p>

            <div className="mb-8">
              <div className="text-4xl font-black mb-2">
                $199<span className="text-lg text-white/60">/month</span>
              </div>
              <p className="text-white/50 text-sm">Billed monthly or save 20% with annual</p>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex gap-3">
                <span className="text-[#f97316] text-lg shrink-0">✓</span>
                <span className="text-white/80 text-sm">1M+ searches/month</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#f97316] text-lg shrink-0">✓</span>
                <span className="text-white/80 text-sm">Unlimited keyword lists</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#f97316] text-lg shrink-0">✓</span>
                <span className="text-white/80 text-sm">Advanced filtering & clustering</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#f97316] text-lg shrink-0">✓</span>
                <span className="text-white/80 text-sm">CSV & Google Sheets export</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#f97316] text-lg shrink-0">✓</span>
                <span className="text-white/80 text-sm">GSC & GA integrations</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#f97316] text-lg shrink-0">✓</span>
                <span className="text-white/80 text-sm">Priority email + chat support</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#f97316] text-lg shrink-0">✓</span>
                <span className="text-white/80 text-sm">Team management (3 users)</span>
              </li>
            </ul>

            <Link href="/register?plan=professional" className="ubk-btn-primary w-full text-center font-bold py-3 rounded-full text-sm">
              Start free trial
            </Link>
            <p className="text-white/40 text-xs text-center mt-3">No credit card required</p>
          </div>

          {/* Enterprise */}
          <div className="bg-slate-900/40 rounded-2xl p-8 border border-white/[0.06] flex flex-col">
            <h3 className="text-2xl font-bold mb-1">Enterprise</h3>
            <p className="text-white/60 text-sm mb-6">For large teams and high-volume needs</p>

            <div className="mb-8">
              <div className="text-4xl font-black mb-2">
                Custom<span className="text-lg text-white/60"></span>
              </div>
              <p className="text-white/50 text-sm">Volume and seat pricing available</p>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex gap-3">
                <span className="text-[#f97316] text-lg shrink-0">✓</span>
                <span className="text-white/80 text-sm">Unlimited everything</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#f97316] text-lg shrink-0">✓</span>
                <span className="text-white/80 text-sm">REST API access</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#f97316] text-lg shrink-0">✓</span>
                <span className="text-white/80 text-sm">Unlimited team members</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#f97316] text-lg shrink-0">✓</span>
                <span className="text-white/80 text-sm">Advanced integrations</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#f97316] text-lg shrink-0">✓</span>
                <span className="text-white/80 text-sm">Dedicated account manager</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#f97316] text-lg shrink-0">✓</span>
                <span className="text-white/80 text-sm">Custom SLAs & support</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#f97316] text-lg shrink-0">✓</span>
                <span className="text-white/80 text-sm">On-premise options available</span>
              </li>
            </ul>

            <Link href="mailto:sales@unboundkeyword.com" className="ubk-btn-primary w-full text-center font-bold py-3 rounded-full text-sm border border-[rgba(241,91,39,0.5)] hover:bg-[rgba(241,91,39,0.1)]">
              Talk to sales
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>

        <div className="space-y-6">
          <div className="bg-slate-900/30 rounded-xl p-6 border border-white/[0.06]">
            <h3 className="font-bold text-lg mb-2">Can I upgrade or downgrade anytime?</h3>
            <p className="text-white/60 text-sm">Yes. Changes take effect at your next billing cycle. If you upgrade mid-month, we'll prorate the difference.</p>
          </div>

          <div className="bg-slate-900/30 rounded-xl p-6 border border-white/[0.06]">
            <h3 className="font-bold text-lg mb-2">What happens if I exceed my search limit?</h3>
            <p className="text-white/60 text-sm">We'll give you a heads-up when you're approaching your limit. You can upgrade, purchase add-on packs, or wait for your limit to reset next month.</p>
          </div>

          <div className="bg-slate-900/30 rounded-xl p-6 border border-white/[0.06]">
            <h3 className="font-bold text-lg mb-2">Will I be charged if I cancel?</h3>
            <p className="text-white/60 text-sm">No cancellation fees. Cancel anytime and you'll keep access through the end of your billing period.</p>
          </div>

          <div className="bg-slate-900/30 rounded-xl p-6 border border-white/[0.06]">
            <h3 className="font-bold text-lg mb-2">Do you offer discounts for annual billing?</h3>
            <p className="text-white/60 text-sm">Yes. Pay for a full year upfront and save 20% on all plans. Plus, lock in the current price—no price increases for that year.</p>
          </div>

          <div className="bg-slate-900/30 rounded-xl p-6 border border-white/[0.06]">
            <h3 className="font-bold text-lg mb-2">Is there a free trial?</h3>
            <p className="text-white/60 text-sm">Yes. All plans come with a 14-day free trial. No credit card required to get started.</p>
          </div>

          <div className="bg-slate-900/30 rounded-xl p-6 border border-white/[0.06]">
            <h3 className="font-bold text-lg mb-2">What about invoicing for enterprises?</h3>
            <p className="text-white/60 text-sm">We support monthly or annual invoicing for enterprise customers. Reach out to our sales team to discuss your needs.</p>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-12 text-center">Plan Comparison</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-4 font-bold text-white/80">Feature</th>
                <th className="text-center py-4 font-bold text-white/80">Starter</th>
                <th className="text-center py-4 font-bold text-white/80">Professional</th>
                <th className="text-center py-4 font-bold text-white/80">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/[0.06]">
                <td className="py-4 text-white/80">Monthly Searches</td>
                <td className="text-center text-white/60">100,000</td>
                <td className="text-center text-white/60">1,000,000+</td>
                <td className="text-center text-white/60">Unlimited</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="py-4 text-white/80">Keyword Lists</td>
                <td className="text-center text-white/60">5</td>
                <td className="text-center text-white/60">Unlimited</td>
                <td className="text-center text-white/60">Unlimited</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="py-4 text-white/80">CSV Exports</td>
                <td className="text-center text-[#f97316]">✓</td>
                <td className="text-center text-[#f97316]">✓</td>
                <td className="text-center text-[#f97316]">✓</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="py-4 text-white/80">Google Sheets Integration</td>
                <td className="text-center text-white/60">–</td>
                <td className="text-center text-[#f97316]">✓</td>
                <td className="text-center text-[#f97316]">✓</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="py-4 text-white/80">Advanced Filtering</td>
                <td className="text-center text-white/60">–</td>
                <td className="text-center text-[#f97316]">✓</td>
                <td className="text-center text-[#f97316]">✓</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="py-4 text-white/80">API Access</td>
                <td className="text-center text-white/60">–</td>
                <td className="text-center text-white/60">–</td>
                <td className="text-center text-[#f97316]">✓</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="py-4 text-white/80">Team Users</td>
                <td className="text-center text-white/60">1</td>
                <td className="text-center text-white/60">3</td>
                <td className="text-center text-white/60">Unlimited</td>
              </tr>
              <tr>
                <td className="py-4 text-white/80">Support</td>
                <td className="text-center text-white/60">Email</td>
                <td className="text-center text-white/60">Email + Chat</td>
                <td className="text-center text-white/60">Dedicated</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <div className="ubk-cta-banner rounded-3xl p-10 md:p-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Simple pricing that <span className="ubk-orange-accent">scales with you</span>
          </h2>
          <p className="text-white/55 mb-8">Start free. Pay as you grow. Transparent pricing, no surprises.</p>
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
