"use client";

import Link from "next/link";

const USE_CASES = [
  {
    icon: "📅",
    title: "Build a 3-month editorial calendar in one session",
    desc: "Enter your pillar topic. Get hundreds of specific article angles, question clusters, and subtopic variations — all with search volume. Map them to a calendar in an afternoon.",
  },
  {
    icon: "🔗",
    title: "Create true content clusters (not just topic lists)",
    desc: "Group keywords by semantic theme. See which sub-topics need articles, which need FAQs, and which need landing pages. Build a cluster architecture that actually works for SEO.",
  },
  {
    icon: "❓",
    title: "Never run out of FAQ and question content",
    desc: "Every topic produces 100–500 PAA questions in UnboundKeyword. Sort by volume and intent. The highest-traffic questions become standalone articles; the rest become FAQ sections and headings.",
  },
  {
    icon: "🎯",
    title: "Match content to buyer stage",
    desc: "Intent analysis labels every keyword as informational, commercial, transactional, or navigational. Build content for every stage of the funnel without guessing what each piece should do.",
  },
  {
    icon: "🔎",
    title: "Discover the language your audience actually uses",
    desc: "Autocomplete data from 51 billion searches reveals the exact phrases people type — not what you assume they would type. Write titles and headings that match real search behavior.",
  },
  {
    icon: "📊",
    title: "Back every piece with data",
    desc: "Show editors, stakeholders, and clients exactly why each content piece was chosen. Volume numbers, competition scores, and question counts make every pitch data-driven.",
  },
];

export default function ForContentStrategists() {
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
          For Content Strategists
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Turn any topic into<br />
          <span className="ubk-orange-accent">6 months of content</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
          The keyword research layer that powers content calendars, content clusters, and content briefs —
          all rooted in what real people actually search for.
        </p>
        <Link href="/register" className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full inline-block">
          Start building your content map
        </Link>
      </section>

      {/* Before / After callout */}
      <section className="max-w-4xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-red-950/20 border border-red-400/15 rounded-xl p-6">
            <h3 className="font-bold text-red-300/80 mb-4 text-sm uppercase tracking-wide">Content without keyword research</h3>
            <ul className="space-y-2 text-white/55 text-sm">
              <li>→ Writing about topics you think are interesting</li>
              <li>→ Publishing and hoping it ranks</li>
              <li>→ No clear connection between content and search demand</li>
              <li>→ Random content calendar with no SEO architecture</li>
              <li>→ Can&apos;t prove ROI to stakeholders</li>
            </ul>
          </div>
          <div className="bg-[rgba(241,91,39,0.04)] border border-[rgba(241,91,39,0.2)] rounded-xl p-6">
            <h3 className="font-bold text-[#f97316] mb-4 text-sm uppercase tracking-wide">Content with UnboundKeyword</h3>
            <ul className="space-y-2 text-white/80 text-sm">
              <li>→ Writing about topics your audience is actively searching</li>
              <li>→ Every article targets a specific keyword cluster</li>
              <li>→ Volume + intent data prove the case for every piece</li>
              <li>→ Content calendar mapped to a semantic architecture</li>
              <li>→ Data-backed reports that stakeholders understand</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-10 text-center">How content strategists use UnboundKeyword</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {USE_CASES.map((uc) => (
            <div key={uc.title} className="bg-slate-900/40 border border-white/[0.06] rounded-xl p-6 hover:border-[rgba(241,91,39,0.2)] transition">
              <div className="text-2xl mb-3">{uc.icon}</div>
              <h3 className="font-bold mb-2">{uc.title}</h3>
              <p className="text-white/55 text-sm leading-relaxed">{uc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Content cluster workflow */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-3 text-center">The content cluster workflow</h2>
        <p className="text-center text-white/50 mb-10 text-sm">From seed keyword to full content plan — in under 2 hours.</p>
        <div className="space-y-4">
          {[
            ["1. Pick your pillar keyword", "Start with the main topic you want to own. e.g., \"email marketing\" for a SaaS brand."],
            ["2. Run a full discovery", "Get 500+ questions, A–Z autocomplete chains, related phrases, and comparisons — all with volume data."],
            ["3. Cluster by theme", "Group keywords into sub-topics: \"email marketing for beginners\", \"email marketing software\", \"email marketing automation\". Each cluster = one content pillar page."],
            ["4. Identify article opportunities", "Questions with 500+ monthly searches = standalone articles. Lower-volume questions = FAQ sections inside longer pieces."],
            ["5. Map intent to funnel stage", "Label each piece: awareness, consideration, decision. Build the full funnel content map."],
            ["6. Export to your content calendar", "Export to CSV or Google Sheets. Add deadlines, writers, and word counts. Your editorial calendar is done."],
          ].map(([step, desc]) => (
            <div key={step as string} className="flex gap-4 bg-slate-900/30 border border-white/[0.05] rounded-xl p-5">
              <span className="text-[#f97316] text-sm font-bold shrink-0 w-6 mt-0.5">→</span>
              <div>
                <h3 className="font-semibold mb-1">{step}</h3>
                <p className="text-white/55 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quote */}
      <section className="max-w-3xl mx-auto px-6 pb-20 text-center">
        <blockquote className="text-lg text-white/75 italic leading-relaxed mb-4">
          &ldquo;I used to spend 3 days building a content strategy for a new client. Now I do it in half a day.
          The question data from UnboundKeyword is genuinely better than what I was getting from tools
          that cost me $150/month more.&rdquo;
        </blockquote>
        <p className="text-white/90 font-bold">Jess Park</p>
        <p className="text-white/45 text-sm">Freelance Content Strategist</p>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <div className="ubk-cta-banner rounded-3xl p-10 md:p-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Build your content strategy<br />
            <span className="ubk-orange-accent">around real search data</span>
          </h2>
          <p className="text-white/55 mb-8">Free trial available. No credit card required.</p>
          <Link href="/register" className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full inline-block">
            Start for free
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
