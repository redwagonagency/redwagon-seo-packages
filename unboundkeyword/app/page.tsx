import Link from "next/link";

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
      </svg>
    ),
    title: "Question Discovery",
    desc: "Every how, what, why, where and when question your audience searches — sorted by volume.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    title: "Keyword List Builder",
    desc: "Organise into named lists. Export to CSV. Bulk-add from any source. Never lose a keyword again.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m7 16 4-4 4 4 4-8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Competitor Gap",
    desc: "Instantly see which keywords competitors rank for that you don't. Find the fastest wins.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9c0-1.657 1.343-3 3-3s3 1.343 3 3c0 2-3 3-3 3" strokeLinecap="round" />
        <circle cx="12" cy="17" r="0.5" fill="currentColor" />
      </svg>
    ),
    title: "LLM Visibility",
    desc: "Check if your brand appears in ChatGPT, Perplexity and Gemini responses for your keywords.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path d="M3 7h4l3 9 3-12 3 9 2-6h3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "A–Z Explorer",
    desc: "Every keyword for every letter of the alphabet — with live search volume data.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
    title: "GSC Integration",
    desc: "Connect Google Search Console and surface real impressions, clicks and hidden opportunities.",
  },
];

export default function HomePage() {
  return (
    <main className="ubk-bg min-h-screen text-white overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
        <span className="text-xl font-black tracking-tight ubk-logo">
          Unbound<span className="text-white/60">Keyword</span>
        </span>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-white/60 hover:text-white text-sm font-medium transition">
            Sign in
          </Link>
          <Link
            href="/register"
            className="ubk-btn-primary text-sm font-bold px-5 py-2.5 rounded-full"
          >
            Start free
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="text-center px-6 pt-24 pb-8 max-w-4xl mx-auto">

        <div className="ubk-badge inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-8">
          <span className="ubk-dot" />
          Now with LLM Visibility & GSC integration
        </div>

        <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-8">
          What are people<br />
          <span className="ubk-headline-accent">searching for?</span>
        </h1>

        <p className="text-lg md:text-xl text-white/55 mb-12 max-w-2xl mx-auto leading-relaxed">
          Discover the exact words your audience uses. Build unlimited keyword lists,
          find competitor gaps, and track your AI visibility — all in one place.
        </p>

        {/* CTA row */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/register"
            className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full w-full sm:w-auto"
          >
            Search any topic — it&apos;s free
          </Link>
          <Link
            href="/login"
            className="ubk-btn-ghost text-base font-semibold px-8 py-4 rounded-full w-full sm:w-auto"
          >
            Sign in →
          </Link>
        </div>

        {/* Stats strip */}
        <div className="flex flex-wrap justify-center gap-8 mt-14 text-sm">
          {[
            { val: "500M+", label: "keywords indexed" },
            { val: "200+", label: "countries" },
            { val: "Free", label: "to start" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black ubk-stat-val">{s.val}</div>
              <div className="text-white/40 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Visualization strip ──────────────────────────── */}
      <section className="py-10 px-6 max-w-5xl mx-auto">
        <div className="ubk-vis-strip rounded-3xl p-8 md:p-12 flex flex-col items-center gap-6">

          {/* Mock search */}
          <div className="flex w-full max-w-xl items-center ubk-mock-search rounded-2xl px-5 py-4">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white/30 mr-3 shrink-0" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            <span className="text-white/25 text-sm">e.g.&nbsp;<em className="not-italic text-white/60">seo tools</em>&hellip;</span>
          </div>

          {/* Keyword cloud preview */}
          <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
            {[
              "how to do seo", "seo tools free", "best seo software",
              "seo checklist", "on-page seo", "keyword research tools",
              "seo audit", "local seo tips", "seo vs ppc", "technical seo guide",
              "rank higher google", "seo for beginners",
            ].map((kw, i) => (
              <span
                key={kw}
                className="ubk-kw-chip text-xs font-medium px-3 py-1.5 rounded-full"
                style={{ opacity: 0.45 + (i % 4) * 0.15 }}
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Grid ─────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-center text-3xl md:text-4xl font-black mb-3">
          Everything keyword research needs
        </h2>
        <p className="text-center text-white/45 mb-12 text-lg">
          One platform from first idea to published content.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="ubk-feature-card rounded-2xl p-7 flex flex-col gap-4">
              <div className="ubk-icon-wrap w-11 h-11 rounded-xl flex items-center justify-center">
                {f.icon}
              </div>
              <div>
                <h3 className="font-bold text-base mb-1">{f.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────── */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <div className="ubk-cta-banner rounded-3xl p-10 md:p-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Start discovering keywords<br />your competitors missed.
          </h2>
          <p className="text-white/55 mb-8 text-lg">
            No credit card required. Unlimited searches on the free plan.
          </p>
          <Link
            href="/register"
            className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full inline-block"
          >
            Create your free account
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-white/[0.07] py-8 text-center text-sm text-white/25">
        © 2026 UnBoundKeyword.com · All rights reserved ·{" "}
        <Link href="/privacy" className="hover:text-white/60 transition">Privacy</Link>
        {" · "}
        <Link href="/terms" className="hover:text-white/60 transition">Terms</Link>
      </footer>

    </main>
  );
}
