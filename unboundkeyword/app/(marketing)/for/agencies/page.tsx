"use client";

import Link from "next/link";

const WORKFLOW = [
  { step: "01", title: "Onboard the client", desc: "Enter their domain and primary topics. Get the full keyword landscape for their niche in minutes — not a week of manual research." },
  { step: "02", title: "Find the gaps", desc: "Run a competitor keyword gap analysis. See which keywords their top 3 competitors rank for that they don't. Instant quick-win opportunities." },
  { step: "03", title: "Build the keyword universe", desc: "Expand every topic with questions (PAA), autocomplete variations, A–Z explorer, and intent signals. Build themed keyword clusters." },
  { step: "04", title: "Bucket and prioritize", desc: "Save high-value keywords into named lists by content pillar, client campaign, or priority tier. Export to CSV or Google Sheets." },
  { step: "05", title: "Deliver the strategy", desc: "Export a clean keyword brief for each client. Show the research, the rationale, and the content roadmap — all backed by live data." },
];

const PAIN_VS_FIX = [
  ["Research takes 2–3 days per client", "Full keyword universe in under 30 minutes per topic"],
  ["Paying $99–$200/mo per tool seat", "Agency plan starts at $99/mo for 10 users + 5 clients"],
  ["Hard to show clients WHY you chose certain keywords", "Question data + intent signals tell the full story"],
  ["Competitor tools miss question-based keywords", "500+ PAA questions per topic, all with volume data"],
  ["Switching between 4 tools for different data types", "One tool covers questions, autocomplete, local, intent, multi-platform"],
  ["Clients don't understand keyword spreadsheets", "Visual spoke wheel and cluster maps tell the story clearly"],
];

export default function ForAgencies() {
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
          For SEO Agencies
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Deliver keyword research<br />
          <span className="ubk-orange-accent">5× faster</span> per client
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
          The research that takes your team 2 days per client takes 30 minutes with UnboundKeyword.
          Depth you can show clients. Speed that scales your agency.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full inline-block">
            Start free trial
          </Link>
          <Link href="/pricing" className="border border-white/25 text-white/80 hover:border-white/50 text-base font-bold px-10 py-4 rounded-full inline-block transition">
            Agency pricing →
          </Link>
        </div>
      </section>

      {/* Pain → Fix */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-10 text-center">The agency keyword research problem — solved</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PAIN_VS_FIX.map(([pain, fix], i) => (
            <div key={i} className="bg-slate-900/30 border border-white/[0.06] rounded-xl p-5">
              <div className="flex gap-3 mb-2">
                <span className="text-red-400/70 text-xs font-semibold bg-red-400/10 border border-red-400/20 px-2.5 py-1 rounded-full shrink-0">Before</span>
                <p className="text-white/50 text-sm">{pain}</p>
              </div>
              <div className="flex gap-3">
                <span className="text-[#f97316] text-xs font-semibold bg-[rgba(241,91,39,0.1)] border border-[rgba(241,91,39,0.25)] px-2.5 py-1 rounded-full shrink-0">After</span>
                <p className="text-white/85 text-sm">{fix}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Agency workflow */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-3 text-center">The agency keyword workflow</h2>
        <p className="text-center text-white/50 mb-12">From client onboarding to keyword deliverable — end to end.</p>
        <div className="space-y-6">
          {WORKFLOW.map((w) => (
            <div key={w.step} className="flex gap-6 bg-slate-900/30 border border-white/[0.06] rounded-xl p-6 hover:border-[rgba(241,91,39,0.2)] transition">
              <div className="text-3xl font-black text-[#f97316]/30 shrink-0 w-10">{w.step}</div>
              <div>
                <h3 className="font-bold text-lg mb-1">{w.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features agencies love */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-10 text-center">Built for agency scale</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            ["🗂️", "Multi-client project management", "Separate projects per client. Each with its own keyword universe, domain targets, and saved lists. No data bleed between clients."],
            ["📋", "Keyword list builder & export", "Save and organize keywords into named lists per client campaign. Export to CSV or Google Sheets for client deliverables."],
            ["🔍", "Competitor keyword gap", "Enter a client's domain and up to 5 competitors. See exactly which keywords they rank for that your client doesn't. Instant quick-win roadmap."],
            ["📊", "Volume & intent data", "Every keyword comes with search volume, competition level, and intent classification (informational / commercial / transactional / navigational)."],
            ["🗺️", "Local targeting at city level", "Run keyword research scoped to specific cities, counties, or states. Perfect for local service businesses and multi-location clients."],
            ["👥", "10 team seats on Agency plan", "Your full team accesses the same projects without per-seat costs. Share research, collaborate on strategy, export together."],
          ].map(([icon, title, desc]) => (
            <div key={title as string} className="bg-slate-900/40 border border-white/[0.06] rounded-xl p-6 flex gap-4">
              <div className="text-2xl shrink-0">{icon}</div>
              <div>
                <h3 className="font-bold mb-2">{title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing callout */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="bg-slate-900/50 border border-[rgba(241,91,39,0.25)] rounded-2xl p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Agency plan — $99/month</h3>
              <ul className="text-white/60 text-sm space-y-1">
                <li>✓ 10 user seats</li>
                <li>✓ 5 projects &amp; 5 client domains</li>
                <li>✓ 200 keyword hunts + 3,000 lookups / month</li>
                <li>✓ Unlimited keyword lists + bulk export</li>
                <li>✓ API access + dedicated support</li>
              </ul>
            </div>
            <div className="shrink-0">
              <Link href="/register?plan=agency" className="ubk-btn-primary font-bold px-8 py-3 rounded-full text-sm inline-block whitespace-nowrap">
                Start free trial
              </Link>
              <p className="text-white/35 text-xs text-center mt-2">14 days free · No card needed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="max-w-3xl mx-auto px-6 pb-20 text-center">
        <blockquote className="text-lg text-white/75 italic leading-relaxed mb-4">
          &ldquo;We run keyword research for 12 active clients. With other tools, each audit took my team 2 full days.
          UnboundKeyword gets us to the deliverable in 2–3 hours max — and the question data we surface is
          genuinely better than what we were getting from Ahrefs.&rdquo;
        </blockquote>
        <p className="text-white/90 font-bold">Marcus Rodriguez</p>
        <p className="text-white/45 text-sm">Founder, Local Visibility Agency</p>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <div className="ubk-cta-banner rounded-3xl p-10 md:p-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Give your agency<br />
            <span className="ubk-orange-accent">the keyword edge</span>
          </h2>
          <p className="text-white/55 mb-8">14-day free trial. No credit card. Cancel anytime.</p>
          <Link href="/register" className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full inline-block">
            Try free for 14 days
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
