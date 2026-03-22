import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-indigo-600 tracking-tight">Unbound</span>
          <span className="text-2xl font-black text-slate-800 tracking-tight">Keyword</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-slate-600 hover:text-slate-900 text-sm font-medium">Sign in</Link>
          <Link href="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-8 pt-20 pb-16 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          ✨ AnswerThePublic-style discovery • Competitor Gap • LLM Visibility
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-6">
          Build unlimited<br />
          <span className="text-indigo-600">keyword lists</span> that convert
        </h1>
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
          Discover every question, preposition and comparison your audience is searching for.
          Organize into lists. Find gaps your competitors are winning. See if you show up in AI answers.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
            Start building for free
          </Link>
          <Link href="/login" className="bg-white text-slate-700 px-8 py-4 rounded-xl text-lg font-bold border border-slate-200 hover:border-slate-300 transition">
            Sign in →
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-6xl mx-auto px-8 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: "🔍",
            title: "Question Discovery",
            desc: "Uncover every how, what, why, where and when question people ask around your topic — sorted by search volume.",
          },
          {
            icon: "📋",
            title: "Keyword List Builder",
            desc: "Drag keywords into named, color-coded lists. Export to CSV. Bulk-add from any source. Never lose a keyword again.",
          },
          {
            icon: "⚔️",
            title: "Competitor Gap",
            desc: "See exactly which keywords your competitors rank for that you don't. Find the fastest wins.",
          },
          {
            icon: "🤖",
            title: "LLM Visibility",
            desc: "Check if your brand appears in ChatGPT, Perplexity and other AI responses for your target keywords.",
          },
          {
            icon: "🅰️",
            title: "A–Z Explorer",
            desc: "Every keyword for every letter of the alphabet. Like AnswerThePublic but with live volume data.",
          },
          {
            icon: "📊",
            title: "Keyword Research",
            desc: "Full keyword overview, magic tool and search intent classification powered by DataForSEO.",
          },
        ].map((f) => (
          <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        © 2026 UnBoundKeyword.com · All rights reserved
      </footer>
    </main>
  );
}
