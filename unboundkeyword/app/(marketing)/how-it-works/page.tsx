"use client";

import Link from "next/link";

const STEPS = [
  {
    number: "1",
    title: "Enter Your Topic",
    description: "Type any keyword, topic, or phrase into UnboundKeyword. It can be a single word or a longer phrase.",
    details: "Simple, straightforward. No complex filters needed to get started."
  },
  {
    number: "2",
    title: "Discover All Variations",
    description: "Instantly see thousands of related keywords across multiple categories: questions, prepositions, comparisons, A-Z keywords, and more.",
    details: "Comprehensive keyword discovery powered by real search data across multiple platforms."
  },
  {
    number: "3",
    title: "Analyze & Filter",
    description: "Sort by search volume, keyword difficulty, CPC, and other metrics. Filter by platform, location, intent, and more.",
    details: "Data-backed analysis helps you prioritize the best keywords for your strategy."
  },
  {
    number: "4",
    title: "Build Your Lists",
    description: "Select the keywords that matter to you. Organize them into named lists for different campaigns or projects.",
    details: "Create structured keyword lists that you can export, share, or use for content planning."
  },
  {
    number: "5",
    title: "Export & Execute",
    description: "Download your keyword lists as CSV, use our API, or share with your team. Take action immediately.",
    details: "Easy integration with your workflow. Use keywords for content creation, SEO, PPC campaigns, and more."
  },
];

export default function HowItWorks() {
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
          <Link href="/pricing" className="ubk-btn-primary text-sm font-bold px-5 py-2 rounded-full">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 py-20 max-w-5xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          How UnboundKeyword <span className="ubk-orange-accent">works</span>
        </h1>
        <p className="text-white/60 text-lg max-w-3xl mx-auto mb-12">
          Five simple steps from topic to actionable keyword lists. See how thousands of users turn search insights into content strategy.
        </p>
      </section>

      {/* Steps */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="space-y-12">
          {STEPS.map((step, index) => (
            <div key={step.number} className="flex gap-8">
              <div className="shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f15b27] to-[#ff9b6e] flex items-center justify-center">
                  <span className="text-2xl font-black">{step.number}</span>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-white/70 mb-3 text-lg">{step.description}</p>
                <p className="text-white/45 text-sm italic">{step.details}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Support */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-8 text-center">Works Across All Platforms</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: "Google", icon: "🔍" },
            { name: "YouTube", icon: "▶️" },
            { name: "Amazon", icon: "📦" },
            { name: "TikTok", icon: "🎵" },
            { name: "Instagram", icon: "📸" },
            { name: "Pinterest", icon: "📌" },
            { name: "Bing", icon: "🔎" },
            { name: "ChatGPT", icon: "🤖" },
          ].map(platform => (
            <div key={platform.name} className="bg-slate-900/40 rounded-xl p-6 text-center border border-white/[0.06]">
              <div className="text-4xl mb-2">{platform.icon}</div>
              <p className="text-white/80 font-medium">{platform.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Key Benefits */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-8">Why UnboundKeyword?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <h4 className="text-xl font-bold mb-2">⚡ Speed</h4>
              <p className="text-white/60">Get comprehensive keyword insights in seconds, not hours.</p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-2">📊 Comprehensive</h4>
              <p className="text-white/60">Questions, prepositions, comparisons, A-Z, local keywords, and more all in one place.</p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-2">🎯 Actionable</h4>
              <p className="text-white/60">Real search volume data and metrics you can act on immediately.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="text-xl font-bold mb-2">💰 Affordable</h4>
              <p className="text-white/60">No per-user licensing. Scale as you grow without breaking the budget.</p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-2">👥 Collaborative</h4>
              <p className="text-white/60">Share lists with team members and clients easily.</p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-2">🔄 Integrated</h4>
              <p className="text-white/60">Export to CSV, connect via API, or import from your tools.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Common Questions */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-8">Common Questions</h2>
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-bold mb-2">How is the data sourced?</h4>
            <p className="text-white/60">Our keyword data comes from real search patterns across Google, YouTube, Amazon, and other major platforms. We combine public data with proprietary research to give you the most accurate insights.</p>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-2">Can I export keywords?</h4>
            <p className="text-white/60">Yes! Export all your keywords as CSV or Excel. You can also integrate via API for automated workflows.</p>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-2">Is my data secure?</h4>
            <p className="text-white/60">Absolutely. We use enterprise-grade security with encryption, regular backups, and compliance with data protection standards.</p>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-2">What's the learning curve?</h4>
            <p className="text-white/60">Minimal. Most users can find valuable keywords within their first 5 minutes. Our interface is designed for simplicity without sacrificing power.</p>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-2">Can multiple people access the same account?</h4>
            <p className="text-white/60">Yes. Invite team members, set permissions, and collaborate on keyword research projects together.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <div className="ubk-cta-banner rounded-3xl p-10 md:p-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Ready to discover <span className="ubk-orange-accent">your best keywords</span>?
          </h2>
          <p className="text-white/55 mb-8">Try UnboundKeyword free. No credit card required.</p>
          <Link href="/pricing" className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full inline-block">
            Start exploring
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
