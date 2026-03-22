"use client";

import Link from "next/link";

export default function ComparisonPage() {
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
          How UnboundKeyword <span className="ubk-orange-accent">compares</span>
        </h1>
        <p className="text-white/60 text-lg max-w-3xl mx-auto">
          Built by creators who outgrew other keyword tools. See why teams switch to UnboundKeyword.
        </p>
      </section>

      {/* Quick Comparison Table */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold mb-8">Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-4 font-bold text-white/80 bg-slate-900/50 sticky left-0">Feature</th>
                <th className="text-center py-4 font-bold text-[#f97316] bg-slate-900/50">UnboundKeyword</th>
                <th className="text-center py-4 font-bold text-white/80">Ahrefs</th>
                <th className="text-center py-4 font-bold text-white/80">SEMrush</th>
                <th className="text-center py-4 font-bold text-white/80">Moz</th>
                <th className="text-center py-4 font-bold text-white/80">SE Ranking</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/[0.06]">
                <td className="py-3 text-white/80 bg-slate-900/30 sticky left-0">Starting Price</td>
                <td className="text-center text-[#f97316] font-bold">$49/mo</td>
                <td className="text-center text-white/60">$99/mo</td>
                <td className="text-center text-white/60">$120/mo</td>
                <td className="text-center text-white/60">$99/mo</td>
                <td className="text-center text-white/60">$55/mo</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="py-3 text-white/80 bg-slate-900/30 sticky left-0">Keyword Research Only</td>
                <td className="text-center text-[#f97316]">✓</td>
                <td className="text-center text-white/50">–</td>
                <td className="text-center text-white/50">–</td>
                <td className="text-center text-white/50">–</td>
                <td className="text-center text-white/50">–</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="py-3 text-white/80 bg-slate-900/30 sticky left-0">Keyword Variations</td>
                <td className="text-center text-[#f97316]">✓✓✓</td>
                <td className="text-center text-white/60">✓✓</td>
                <td className="text-center text-white/60">✓✓</td>
                <td className="text-center text-white/60">✓</td>
                <td className="text-center text-white/60">✓✓</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="py-3 text-white/80 bg-slate-900/30 sticky left-0">Local Keywords by City</td>
                <td className="text-center text-[#f97316]">✓</td>
                <td className="text-center text-white/60">✓</td>
                <td className="text-center text-white/60">✓</td>
                <td className="text-center text-white/60">–</td>
                <td className="text-center text-white/60">–</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="py-3 text-white/80 bg-slate-900/30 sticky left-0">Keyword Clustering</td>
                <td className="text-center text-[#f97316]">✓ (Visual)</td>
                <td className="text-center text-white/60">–</td>
                <td className="text-center text-white/60">–</td>
                <td className="text-center text-white/60">–</td>
                <td className="text-center text-white/60">–</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="py-3 text-white/80 bg-slate-900/30 sticky left-0">Google Sheets Integration</td>
                <td className="text-center text-[#f97316]">✓</td>
                <td className="text-center text-white/60">–</td>
                <td className="text-center text-white/60">–</td>
                <td className="text-center text-white/60">✓</td>
                <td className="text-center text-white/60">✓</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="py-3 text-white/80 bg-slate-900/30 sticky left-0">Backlink Analysis</td>
                <td className="text-center text-white/50">–</td>
                <td className="text-center text-[#f97316]">✓✓✓</td>
                <td className="text-center text-white/60">✓✓✓</td>
                <td className="text-center text-white/60">✓✓</td>
                <td className="text-center text-white/60">✓✓</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="py-3 text-white/80 bg-slate-900/30 sticky left-0">Rank Tracking</td>
                <td className="text-center text-white/50">–</td>
                <td className="text-center text-[#f97316]">✓✓✓</td>
                <td className="text-center text-white/60">✓✓✓</td>
                <td className="text-center text-white/60">✓✓✓</td>
                <td className="text-center text-white/60">✓✓✓</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="py-3 text-white/80 bg-slate-900/30 sticky left-0">Site Audit</td>
                <td className="text-center text-white/50">–</td>
                <td className="text-center text-[#f97316]">✓✓✓</td>
                <td className="text-center text-white/60">✓✓✓</td>
                <td className="text-center text-white/60">✓✓</td>
                <td className="text-center text-white/60">✓✓</td>
              </tr>
              <tr>
                <td className="py-3 text-white/80 bg-slate-900/30 sticky left-0">Spec-Focused</td>
                <td className="text-center text-[#f97316]">Keyword Research</td>
                <td className="text-center text-white/60">All-in-one</td>
                <td className="text-center text-white/60">All-in-one</td>
                <td className="text-center text-white/60">All-in-one</td>
                <td className="text-center text-white/60">All-in-one</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Why Choose UnboundKeyword */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-12">Why Teams Choose UnboundKeyword</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-900/40 rounded-2xl p-8 border border-white/[0.06]">
            <h3 className="text-xl font-bold mb-3">💰 Affordable</h3>
            <p className="text-white/60">Start at $49/month vs. $99-200 for other tools. Perfect keyword research without paying for features you don't need.</p>
          </div>

          <div className="bg-slate-900/40 rounded-2xl p-8 border border-white/[0.06]">
            <h3 className="text-xl font-bold mb-3">🎯 Specialized</h3>
            <p className="text-white/60">We focus on one thing and do it exceptionally well. Keyword discovery, not kitchen sink features.</p>
          </div>

          <div className="bg-slate-900/40 rounded-2xl p-8 border border-white/[0.06]">
            <h3 className="text-xl font-bold mb-3">📊 Deep Variations</h3>
            <p className="text-white/60">Discover 10x more keyword variations than competitors. Find the opportunities everyone else misses.</p>
          </div>

          <div className="bg-slate-900/40 rounded-2xl p-8 border border-white/[0.06]">
            <h3 className="text-xl font-bold mb-3">📍 Local Keywords</h3>
            <p className="text-white/60">Built for local SEO. Search by city, state, or region at scale. No other tool does this as well.</p>
          </div>

          <div className="bg-slate-900/40 rounded-2xl p-8 border border-white/[0.06]">
            <h3 className="text-xl font-bold mb-3">⚡ Fast</h3>
            <p className="text-white/60">Results in seconds, not minutes. Optimized performance so you spend less time waiting, more time analyzing.</p>
          </div>

          <div className="bg-slate-900/40 rounded-2xl p-8 border border-white/[0.06]">
            <h3 className="text-xl font-bold mb-3">🤝 Built by Marketers</h3>
            <p className="text-white/60">Created by people who actually do SEO and content marketing. We understand your workflow.</p>
          </div>
        </div>
      </section>

      {/* Use Case Differences */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-12">When to Use Each Tool</h2>
        <div className="space-y-6">
          <div className="bg-slate-900/30 rounded-xl p-6 border border-white/[0.06]">
            <h3 className="font-bold text-lg text-[#f97316] mb-2">✓ Choose UnboundKeyword for:</h3>
            <ul className="space-y-2 text-white/80">
              <li>• Keyword research and discovery (it's our specialty)</li>
              <li>• Local SEO and city/state-level keyword targeting</li>
              <li>• Content strategy development and roadmaps</li>
              <li>• Tight budgets or startup companies</li>
              <li>• Teams who want one focused tool instead of a platform</li>
              <li>• Agencies who need affordable, deep keyword data</li>
            </ul>
          </div>

          <div className="bg-slate-900/30 rounded-xl p-6 border border-white/[0.06]">
            <h3 className="font-bold text-lg text-white/80 mb-2">Consider Other Tools if you Need:</h3>
            <ul className="space-y-2 text-white/80">
              <li>• Backlink analysis and competitive backlink research</li>
              <li>• Daily rank tracking across competitors</li>
              <li>• Technical site audits and health monitoring</li>
              <li>• All-in-one platform with PPC, content, and social tools</li>
              <li>• Large database of existing rankings and history</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-12 text-center">What Users Say About The Difference</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-900/40 rounded-xl p-6 border border-white/[0.06]">
            <p className="text-white/80 mb-4 italic">"I switched from Ahrefs to UnboundKeyword for keyword research. The quality of variations is insane, and at $49/month I'm saving $150 a month for a better discovery experience."</p>
            <p className="font-bold text-white">Sarah Chen</p>
            <p className="text-white/60 text-sm">Content Director, Tech Startup</p>
          </div>

          <div className="bg-slate-900/40 rounded-xl p-6 border border-white/[0.06]">
            <p className="text-white/80 mb-4 italic">"The local keywords feature is a game-changer for our agency. We can now bid on services in 50+ cities without manually researching each one."</p>
            <p className="font-bold text-white">Marcus Rodriguez</p>
            <p className="text-white/60 text-sm">SEO Agency Owner</p>
          </div>

          <div className="bg-slate-900/40 rounded-xl p-6 border border-white/[0.06]">
            <p className="text-white/80 mb-4 italic">"We had the all-in-one tools, but we barely used 20% of features. UnboundKeyword is laser-focused on keyword discovery and it shows. Much better value."</p>
            <p className="font-bold text-white">Priya Patel</p>
            <p className="text-white/60 text-sm">SEO Manager, E-commerce</p>
          </div>

          <div className="bg-slate-900/40 rounded-xl p-6 border border-white/[0.06]">
            <p className="text-white/80 mb-4 italic">"I love how fast it is. Other tools make me wait minutes for results. UnboundKeyword gives me keywords in seconds, so I can iterate faster."</p>
            <p className="font-bold text-white">David Thompson</p>
            <p className="text-white/60 text-sm">Freelance Content Consultant</p>
          </div>
        </div>
      </section>

      {/* Cost Comparison */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-12 text-center">Cost Comparison (Annual)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-b from-[#f97316]/10 to-transparent rounded-xl p-6 border border-[#f97316]/30">
            <h4 className="font-bold text-lg text-[#f97316] mb-2">UnboundKeyword</h4>
            <div className="text-3xl font-black text-white mb-1">$470</div>
            <p className="text-white/60 text-sm mb-4">Starter plan ($49/mo × 12, with 20% annual discount)</p>
            <div className="bg-slate-900/50 rounded p-3">
              <p className="text-white/80 text-sm"><strong>What you get:</strong> Expert keyword research, all variations, local keywords, clustering</p>
            </div>
          </div>

          <div className="bg-slate-900/40 rounded-xl p-6 border border-white/[0.06]">
            <h4 className="font-bold text-lg text-white/80 mb-2">SEMrush</h4>
            <div className="text-3xl font-black text-white mb-1">$1,440</div>
            <p className="text-white/60 text-sm mb-4">Standard plan ($120/mo)</p>
            <div className="bg-slate-900/50 rounded p-3">
              <p className="text-white/80 text-sm"><strong>What you get:</strong> Keywords + backlinks + rank tracking + audits + PPC tools</p>
            </div>
          </div>

          <div className="bg-slate-900/40 rounded-xl p-6 border border-white/[0.06]">
            <h4 className="font-bold text-lg text-white/80 mb-2">Ahrefs</h4>
            <div className="text-3xl font-black text-white mb-1">$1,188</div>
            <p className="text-white/60 text-sm mb-4">Lite plan ($99/mo)</p>
            <div className="bg-slate-900/50 rounded p-3">
              <p className="text-white/80 text-sm"><strong>What you get:</strong> Keywords + backlinks + rank tracking + audits + content tools</p>
            </div>
          </div>
        </div>

        <p className="text-center text-white/60 text-sm mt-8">
          <strong>Bottom line:</strong> Save $700-1000/year with UnboundKeyword if keyword research is your primary need. Add backlink or rank tracking tools separately if needed.
        </p>
      </section>

      {/* Migration */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-12 text-center">Easy Migration</h2>
        <div className="bg-slate-900/40 rounded-2xl p-8 border border-white/[0.06]">
          <p className="text-white/80 mb-6">Already using another tool? We make switching simple:</p>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-[#f97316] text-lg shrink-0">✓</span>
              <span className="text-white/80"><strong>Import existing keyword lists</strong> – Upload CSV from any tool</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#f97316] text-lg shrink-0">✓</span>
              <span className="text-white/80"><strong>One-click migration</strong> – We'll help move your data and set up integrations</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#f97316] text-lg shrink-0">✓</span>
              <span className="text-white/80"><strong>No double-billing</strong> – Start with a free trial to test before switching</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#f97316] text-lg shrink-0">✓</span>
              <span className="text-white/80"><strong>Dedicated support</strong> – Our team helps with onboarding every step</span>
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <div className="ubk-cta-banner rounded-3xl p-10 md:p-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            See the difference for <span className="ubk-orange-accent">yourself</span>
          </h2>
          <p className="text-white/55 mb-8">Try UnboundKeyword free for 14 days. No credit card required.</p>
          <Link href="/register" className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full inline-block">
            Start free trial
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
