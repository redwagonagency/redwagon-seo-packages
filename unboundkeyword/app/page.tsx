"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

// ── Static platform data (ATP-style chart) ───────────────────────────────────
const PLATFORMS = [
  { name: "Google",       abbr: "G",  val: 13.7, color: "#EA4335", highlight: true  },
  { name: "Instagram",    abbr: "Ig", val: 6.5,  color: "#C13584", highlight: false },
  { name: "Baidu",        abbr: "Bd", val: 5.0,  color: "#2932E1", highlight: false },
  { name: "Snapchat",     abbr: "Sc", val: 4.0,  color: "#FFCC00", highlight: false },
  { name: "Amazon",       abbr: "Az", val: 3.5,  color: "#FF9900", highlight: false },
  { name: "YouTube",      abbr: "YT", val: 3.3,  color: "#FF0000", highlight: false },
  { name: "LinkedIn",     abbr: "Li", val: 3.2,  color: "#0A66C2", highlight: false },
  { name: "Pinterest",    abbr: "Pi", val: 2.4,  color: "#E60023", highlight: false },
  { name: "Google Play",  abbr: "GP", val: 2.1,  color: "#01875F", highlight: false },
  { name: "Facebook",     abbr: "Fb", val: 1.5,  color: "#1877F2", highlight: false },
  { name: "Yahoo",        abbr: "Ya", val: 1.1,  color: "#720E9E", highlight: false },
  { name: "TikTok",       abbr: "Tk", val: 1.0,  color: "#555555", highlight: false },
  { name: "ChatGPT",      abbr: "AI", val: 1.0,  color: "#10A37F", highlight: false },
  { name: "Reddit",       abbr: "Re", val: 0.9,  color: "#FF4500", highlight: false },
  { name: "Bing",         abbr: "Bi", val: 0.6,  color: "#008373", highlight: false },
  { name: "X",            abbr: "X",  val: 0.5,  color: "#444444", highlight: false },
  { name: "App Store",    abbr: "AS", val: 0.5,  color: "#0070C9", highlight: false },
];

const CHART_H   = 140;  // px — height of the tallest possible bar
const SCALE_MAX = 16;   // billions
const GRID_VALS = [16, 12, 8, 4] as const;

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
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/register?q=${encodeURIComponent(q)}`);
  }

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
          <Link href="/register" className="ubk-btn-primary text-sm font-bold px-5 py-2.5 rounded-full">
            Start free
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="text-center px-6 pt-16 pb-6 max-w-4xl mx-auto">

        <div className="ubk-badge inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-8">
          <span className="ubk-dot" />
          51 billion searches daily — only 27% happen on Google
        </div>

        <h1 className="text-5xl md:text-6xl font-black leading-[1.08] tracking-tight mb-6">
          Unlock what people search for<br />
          <span className="ubk-headline-accent">everywhere — not just Google</span>
        </h1>

        <p className="text-lg text-white/50 mb-9 max-w-2xl mx-auto leading-relaxed">
          Enter any topic or brand to discover every question, phrase and hidden intent
          your audience searches — across Google, YouTube, ChatGPT, TikTok and 13 more platforms.
        </p>

        {/* ── Search box ── */}
        <form
          onSubmit={handleSearch}
          className="ubk-search-form flex items-center max-w-2xl mx-auto rounded-2xl px-4 py-2 gap-3"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white/30 shrink-0" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Enter a topic, brand or question…"
            className="flex-1 bg-transparent text-white placeholder:text-white/30 text-base outline-none"
          />
          <button
            type="submit"
            className="ubk-btn-primary text-sm font-bold px-6 py-2.5 rounded-xl shrink-0"
          >
            Search
          </button>
        </form>
      </section>

      {/* ── Platform Chart ───────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-6">
        <div className="ubk-vis-strip rounded-3xl p-6 md:p-8">

          {/* Chart header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <div className="text-white/40 text-xs mb-0.5">Daily searches per platform (in billions)</div>
              <div className="text-3xl font-black">51 billion</div>
            </div>
            <div className="ubk-chart-badge rounded-xl px-4 py-3 text-sm">
              There are <span className="text-orange-400 font-bold">51 billion</span> searches daily,
              and only <span className="font-bold text-white">27% are on Google</span>.
            </div>
          </div>

          {/* Bar chart */}
          <div className="overflow-x-auto">
            <div className="min-w-[540px]">

              {/* Chart area — relative container for gridlines + bars */}
              <div className="relative" style={{ height: CHART_H + "px" }}>

                {/* Y-axis gridlines */}
                {GRID_VALS.map(v => (
                  <div
                    key={v}
                    className="absolute left-0 right-0 flex items-center pointer-events-none"
                    style={{ bottom: (v / SCALE_MAX) * CHART_H + "px" }}
                  >
                    <span className="text-[10px] text-white/30 w-8 shrink-0 text-right pr-1.5 leading-none">
                      {v} B
                    </span>
                    <div className="flex-1 border-t border-dashed border-white/[0.08]" />
                  </div>
                ))}

                {/* Bars */}
                <div
                  className="absolute right-0 bottom-0 flex items-end gap-[3px]"
                  style={{ left: "36px", top: 0 }}
                >
                  {PLATFORMS.map(p => {
                    const barH = Math.round((p.val / SCALE_MAX) * CHART_H);
                    return (
                      <div
                        key={p.name}
                        className="relative flex-1 flex flex-col items-center justify-end"
                        title={`${p.name}: ${p.val}B daily searches`}
                      >
                        {/* Value label */}
                        <div
                          className="absolute text-[9px] font-bold text-white rounded px-[3px] leading-tight tabular-nums"
                          style={{
                            bottom: barH + 4,
                            background: "#0b0b18",
                            border: "1px solid rgba(255,255,255,0.14)",
                          }}
                        >
                          {p.val}
                        </div>
                        {/* Bar */}
                        <div
                          className="w-full rounded-t-[3px] transition-opacity hover:opacity-75 cursor-default"
                          style={{
                            height: barH,
                            background: p.highlight
                              ? "linear-gradient(to top,#f97316,#fbbf24)"
                              : "#3f3f52",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Platform icon row */}
              <div className="flex gap-[3px] mt-3" style={{ paddingLeft: "36px" }}>
                {PLATFORMS.map(p => (
                  <div key={p.name} className="flex-1 flex justify-center" title={p.name}>
                    <div
                      className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[8px] font-black leading-none text-white shrink-0"
                      style={{ background: p.color }}
                    >
                      {p.abbr}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-5 pt-4 border-t border-white/[0.07]">
            <div className="flex items-center gap-2 text-sm text-white/55">
              <div className="w-3 h-3 rounded-sm" style={{ background: "linear-gradient(135deg,#f97316,#fbbf24)" }} />
              Google — 27% of all searches
            </div>
            <div className="flex items-center gap-2 text-sm text-white/55">
              <div className="w-3 h-3 rounded-sm bg-[#3f3f52]" />
              Other platforms — 73%
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Grid ─────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-14">
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

