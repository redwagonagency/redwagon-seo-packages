import Link from "next/link";

export const metadata = {
  title: "UnboundKeyword Blog — Keyword Research Tips, SEO Strategy & Content Planning",
  description: "Expert content on keyword research, SEO strategy, and content marketing — from the team behind UnboundKeyword.",
};

const CATEGORIES = [
  { emoji: "🔍", title: "Keyword Research", desc: "Deep dives into finding keywords that drive real traffic" },
  { emoji: "📝", title: "Content Strategy", desc: "How to turn keywords into content that converts" },
  { emoji: "📍", title: "Local SEO", desc: "City-level targeting and local keyword tactics" },
  { emoji: "🤖", title: "AI & LLM SEO", desc: "Ranking in ChatGPT, Gemini, Perplexity and AI search" },
  { emoji: "📊", title: "Tool Tutorials", desc: "Step-by-step guides to getting the most from UnboundKeyword" },
  { emoji: "⚖️", title: "Comparisons", desc: "Side-by-side looks at keyword tools and strategies" },
];

const COMING_SOON = [
  {
    category: "Keyword Research",
    title: "How to Find 500+ Question Keywords From Any Topic in 10 Minutes",
    preview: "The PAA (People Also Ask) goldmine — and how to extract every variation your audience is searching for.",
  },
  {
    category: "Local SEO",
    title: "City-Level Keyword Research: The Complete Guide for Local Businesses",
    preview: "How to scale local keyword research across dozens of cities without hiring a researcher for each one.",
  },
  {
    category: "Content Strategy",
    title: "The Content Cluster Method: Turning One Keyword Into 40 Articles",
    preview: "How to use a single seed keyword to map a 3-month editorial calendar with proven search demand.",
  },
  {
    category: "AI & LLM SEO",
    title: "Does Your Brand Show Up in ChatGPT? How to Check and What to Do",
    preview: "LLM visibility is the new SEO frontier. Here's how to audit your brand's presence in AI answers.",
  },
  {
    category: "Tool Tutorials",
    title: "The A–Z Keyword Method: Finding Keywords Nobody Else Has Found",
    preview: "UnboundKeyword's A-Z autocomplete explorer surfaces hidden keyword gems. Here's the workflow.",
  },
  {
    category: "Comparisons",
    title: "UnboundKeyword vs Ahrefs vs SEMrush: Honest Side-by-Side",
    preview: "We tested all three tools on the same 10 keywords. Here's what the data actually shows.",
  },
];

export default function BlogPage() {
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
          Blog
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Keyword research.<br />
          <span className="ubk-orange-accent">Done deeply.</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto">
          Practical guides, strategies, and tool walkthroughs — from people who spend their days doing keyword research.
        </p>
      </section>

      {/* Categories */}
      <section className="max-w-5xl mx-auto px-6 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {CATEGORIES.map((c) => (
            <div key={c.title} className="bg-slate-900/40 border border-white/[0.06] rounded-xl p-5 hover:border-[rgba(241,91,39,0.35)] transition cursor-default">
              <div className="text-2xl mb-2">{c.emoji}</div>
              <div className="font-bold text-sm mb-1">{c.title}</div>
              <div className="text-white/45 text-xs">{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Coming soon articles */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <h2 className="text-2xl font-bold">Coming soon</h2>
          <span className="bg-[rgba(241,91,39,0.15)] border border-[rgba(241,91,39,0.3)] text-[#f97316] text-xs font-semibold px-3 py-1 rounded-full">
            Publishing shortly
          </span>
        </div>

        <div className="space-y-4">
          {COMING_SOON.map((post) => (
            <div key={post.title} className="bg-slate-900/40 border border-white/[0.06] rounded-xl p-6 flex flex-col md:flex-row gap-4 hover:border-white/[0.12] transition">
              <div className="shrink-0">
                <span className="text-xs font-semibold text-[#f97316] bg-[rgba(241,91,39,0.1)] px-3 py-1 rounded-full">
                  {post.category}
                </span>
              </div>
              <div>
                <h3 className="font-bold mb-1 text-white">{post.title}</h3>
                <p className="text-white/50 text-sm">{post.preview}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter signup */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="bg-slate-900/50 border border-white/[0.07] rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Get new posts first</h3>
          <p className="text-white/55 text-sm mb-6">
            No fluff, no weekly newsletter. Just useful deep-dives when we publish them — usually 2–3 per month.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" action="#">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 bg-white/[0.05] border border-white/[0.12] rounded-full px-5 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[rgba(241,91,39,0.5)]"
            />
            <button type="submit" className="ubk-btn-primary font-bold px-6 py-3 rounded-full text-sm shrink-0">
              Notify me
            </button>
          </form>
          <p className="text-white/25 text-xs mt-3">No spam. Unsubscribe anytime.</p>
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
