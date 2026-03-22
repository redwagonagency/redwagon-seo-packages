"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

// ── Platform selector tabs ────────────────────────────────────────────────────
const TABS = [
  { id: "google",  label: "Google"  },
  { id: "bing",    label: "Bing"    },
  { id: "youtube", label: "YouTube" },
  { id: "tiktok",  label: "TikTok"  },
  { id: "amazon",  label: "Amazon"  },
  { id: "chatgpt", label: "ChatGPT" },
];

// ── Autosuggest preview cards ─────────────────────────────────────────────────
const SUGGEST_CARDS = [
  {
    prefix: "keyword research",
    items: [
      "keyword research tools",
      "keyword research for seo",
      "keyword research free",
      "keyword research tutorial 2026",
      "keyword research vs topic clusters",
    ],
    highlight: 2,
  },
  {
    prefix: "which seo",
    label: "Which",
    items: [
      "which seo tool is the best",
      "which seo plugin for wordpress",
      "which seo course is worth it",
      "which seo rank checker is free",
      "which seo metrics actually matter",
    ],
    highlight: 0,
  },
];

// ── Spoke chart sections ──────────────────────────────────────────────────────
const SPOKE_SECTIONS = [
  { label: "who",   angle: -90,  color: "#f97316", kws: ["who does seo",    "who needs seo",    "who created seo"   ] },
  { label: "what",  angle: -45,  color: "#a855f7", kws: ["what is seo",     "what does seo do", "what are keywords" ] },
  { label: "where", angle:   0,  color: "#ec4899", kws: ["where to learn",  "where to rank",    "where seo helps"   ] },
  { label: "when",  angle:  45,  color: "#f59e0b", kws: ["when to start",   "when seo works",   "when to hire seo"  ] },
  { label: "why",   angle:  90,  color: "#10b981", kws: ["why seo matters", "why seo fails",    "why seo is slow"   ] },
  { label: "how",   angle: 135,  color: "#06b6d4", kws: ["how to do seo",   "how seo works",    "how much seo costs"] },
  { label: "which", angle: 180,  color: "#8b5cf6", kws: ["which seo tool",  "which seo course", "which seo plugin"  ] },
  { label: "are",   angle: -135, color: "#f43f5e", kws: ["are tools worth",  "are audits needed", "are backlinks key" ] },
];

// ── Static platform data (ATP-style chart) ────────────────────────────────────
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

const CHART_H   = 140;
const SCALE_MAX = 16;
const GRID_VALS = [16, 12, 8, 4] as const;

// ── Spoke wheel SVG ───────────────────────────────────────────────────────────
function SpokeWheel({ keyword = "seo" }: { keyword?: string }) {
  const cx = 350, cy = 320;
  const innerR = 62;
  const offsets = [-14, 0, 14] as const;
  const radii   = [150, 205, 268] as const;

  return (
    <svg viewBox="0 0 700 640" className="w-full select-none" style={{ maxHeight: 520 }}>
      {/* Dashed guide rings */}
      {[278, 193, 112].map(r => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none"
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="5 12" />
      ))}

      {SPOKE_SECTIONS.map(s => {
        const baseRad = (s.angle * Math.PI) / 180;
        return (
          <g key={s.label}>
            {offsets.map((off, i) => {
              const rad = ((s.angle + off) * Math.PI) / 180;
              const x1  = cx + (innerR + 8)    * Math.cos(rad);
              const y1  = cy + (innerR + 8)    * Math.sin(rad);
              const x2  = cx + radii[i]        * Math.cos(rad);
              const y2  = cy + radii[i]        * Math.sin(rad);
              const tx  = cx + (radii[i] + 4)  * Math.cos(rad);
              const ty  = cy + (radii[i] + 4)  * Math.sin(rad);
              const anchor = (tx > cx + 8 ? "start" : tx < cx - 8 ? "end" : "middle") as "start" | "end" | "middle";
              const dy = ty > cy + 8 ? 10 : ty < cy - 8 ? -4 : 4;
              return (
                <g key={i}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={s.color} strokeWidth="1" opacity="0.22" />
                  <circle cx={x2} cy={y2} r="4" fill={s.color} opacity="0.55" />
                  <text
                    x={tx + (anchor === "start" ? 7 : anchor === "end" ? -7 : 0)}
                    y={ty + dy}
                    fontSize="9.5" fill="rgba(255,255,255,0.6)"
                    textAnchor={anchor}>
                    {s.kws[i]}
                  </text>
                </g>
              );
            })}
            {/* Section label */}
            <text
              x={cx + 90 * Math.cos(baseRad)}
              y={cy + 90 * Math.sin(baseRad) + 4}
              fontSize="12" fontWeight="800"
              fill={s.color} textAnchor="middle" dominantBaseline="middle" opacity="0.9">
              {s.label}
            </text>
          </g>
        );
      })}

      {/* Center circle */}
      <circle cx={cx} cy={cy} r={innerR} fill="#0b0b18" stroke="rgba(168,85,247,0.5)" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={innerR - 5} fill="rgba(124,58,237,0.15)" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="900" fill="white">
        {keyword}
      </text>
      <text x={cx} y={cy + 17} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.35)" letterSpacing="1.5">
        EXPLORE
      </text>
    </svg>
  );
}

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
  const [query, setQuery]         = useState("");
  const [activeTab, setActiveTab] = useState("google");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/register?q=${encodeURIComponent(q)}`);
  }

  return (
    <main className="ubk-bg min-h-screen text-white overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
        <span className="text-xl font-black tracking-tight ubk-logo">
          Unbound<span className="text-white/60">Keyword</span>
        </span>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-white/60 hover:text-white text-sm font-medium transition">
            Sign in
          </Link>
          <Link href="/register" className="ubk-btn-primary text-sm font-bold px-5 py-2.5 rounded-full">
            Get started
          </Link>
        </div>
      </nav>

      {/* ── HERO (full-screen ATP-style dark) ───────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-10 pb-20 overflow-hidden">

        {/* Decorative background wheel */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <svg viewBox="0 0 900 900" className="w-[720px] h-[720px] opacity-[0.06]">
            {Array.from({ length: 20 }, (_, i) => {
              const a = (i * 18 * Math.PI) / 180;
              return <line key={i} x1={450} y1={450} x2={450 + 430 * Math.cos(a)} y2={450 + 430 * Math.sin(a)} stroke="white" strokeWidth="1" />;
            })}
            {[430, 310, 185, 75].map(r => (
              <circle key={r} cx={450} cy={450} r={r} fill="none" stroke="white" strokeWidth="1" />
            ))}
          </svg>
        </div>

        <div className="ubk-badge inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-8 relative z-10">
          <span className="ubk-dot" />
          Includes ChatGPT · TikTok · YouTube · Amazon &amp; more
        </div>

        <h1 className="relative z-10 text-5xl md:text-[68px] font-black leading-[1.06] tracking-tight mb-5">
          Discover what people<br />
          are <span className="ubk-headline-accent italic">searching for…</span>
        </h1>

        <p className="relative z-10 text-white/50 text-lg mb-8 max-w-lg leading-relaxed">
          Across every platform that matters — from Google to ChatGPT — all in one place.
        </p>

        {/* Platform tabs */}
        <div className="relative z-10 flex flex-wrap justify-center gap-2 mb-5">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`ubk-tab ${activeTab === t.id ? "ubk-tab-active" : ""} px-4 py-1.5 rounded-full text-sm font-semibold`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search form */}
        <form
          onSubmit={handleSearch}
          className="relative z-10 ubk-search-form flex items-center w-full max-w-xl rounded-2xl px-4 py-2 gap-3"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white/30 shrink-0" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Enter a topic, keyword or brand…"
            className="flex-1 bg-transparent text-white placeholder:text-white/30 text-base outline-none"
          />
          <button type="submit" className="ubk-btn-primary text-sm font-bold px-6 py-2.5 rounded-xl shrink-0">
            Search
          </button>
        </form>
        <p className="relative z-10 text-white/25 text-xs mt-3">Use 1–3 words for best results</p>
      </section>

      {/* ── SPOKE WHEEL EXPLORER ─────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="ubk-badge inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-5">
              Visual Keyword Explorer
            </div>
            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-5">
              Discover an{" "}
              <span className="ubk-headline-accent">untapped goldmine</span>{" "}
              of content ideas
            </h2>
            <p className="text-white/50 leading-relaxed mb-5 text-lg">
              UnboundKeyword turns any search engine into autocomplete data — quickly churning out
              every question, phrase and hidden intent people search around your keyword.
            </p>
            <p className="text-white/35 text-sm mb-8 italic border-l-2 border-purple-500/40 pl-4">
              &ldquo;It&rsquo;s a goldmine of consumer insight you can use to create fresh, ultra-useful
              content your customers really want.&rdquo;
            </p>
            <Link href="/register" className="ubk-btn-primary font-bold px-8 py-3 rounded-full inline-block text-sm">
              Start exploring — it&apos;s free
            </Link>
          </div>
          <div className="ubk-vis-strip rounded-3xl p-4 md:p-6">
            <SpokeWheel keyword="keyword" />
            <p className="text-center text-white/20 text-xs mt-1">Interactive keyword exploration wheel</p>
          </div>
        </div>
      </section>

      {/* ── AUTOSUGGEST PREVIEW ──────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black mb-3">
            See exactly what people type —{" "}
            <span className="ubk-headline-accent">autocomplete insights</span>
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto">
            Every autocomplete suggestion, for every letter of the alphabet, visualised for your keyword.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {SUGGEST_CARDS.map(card => (
            <div key={card.prefix} className="ubk-feature-card rounded-2xl p-6">
              {/* Mock search bar header */}
              <div className="ubk-mock-search flex items-center rounded-xl px-4 py-3 mb-4 gap-3">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white/30 shrink-0" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </svg>
                <span className="text-white/80 text-sm font-medium">{card.prefix}</span>
                <span className="ml-auto text-[10px] text-white/25 border border-white/10 rounded px-1.5 py-0.5">Hide</span>
              </div>
              {/* Suggestions list */}
              <ul className="flex flex-col gap-0.5">
                {card.items.map((item, i) => (
                  <li
                    key={item}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition ${
                      i === card.highlight ? "bg-white/[0.08]" : "hover:bg-white/[0.05]"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-white/20 shrink-0" stroke="currentColor" strokeWidth={2}>
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                    </svg>
                    <span className={`text-sm ${i === card.highlight ? "text-white font-medium" : "text-white/60"}`}>
                      {item}
                    </span>
                    {i === card.highlight && (
                      <span className="ml-auto text-[10px] font-bold text-amber-400 border border-amber-400/30 rounded px-1.5 py-0.5 bg-amber-400/10 shrink-0">
                        HIGH
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
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

