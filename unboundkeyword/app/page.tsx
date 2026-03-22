"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

// ── Platform selector tabs ────────────────────────────────────────────────────
const TABS = [
  { id: "google",    label: "Google"    },
  { id: "instagram", label: "Instagram" },
  { id: "bing",      label: "Bing"      },
  { id: "amazon",    label: "Amazon"    },
  { id: "youtube",   label: "YouTube"   },
  { id: "tiktok",    label: "TikTok"    },
  { id: "chatgpt",   label: "ChatGPT"   },
];

// ── Platform bar chart ────────────────────────────────────────────────────────
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

const CHART_H   = 130;
const SCALE_MAX = 16;
const GRID_VALS = [16, 12, 8, 4] as const;

// ── Spoke wheel sections ──────────────────────────────────────────────────────
const SPOKE_SECTIONS = [
  { label: "who",   angle: -90,  color: "#f97316", kws: ["who does seo",    "who needs seo",    "who created seo"   ] },
  { label: "what",  angle: -45,  color: "#a855f7", kws: ["what is seo",     "what does seo do", "what are keywords" ] },
  { label: "where", angle:   0,  color: "#ec4899", kws: ["where to learn",  "where to rank",    "where seo helps"   ] },
  { label: "when",  angle:  45,  color: "#f59e0b", kws: ["when to start",   "when seo works",   "when to hire seo"  ] },
  { label: "why",   angle:  90,  color: "#10b981", kws: ["why seo matters", "why seo fails",    "why seo is slow"   ] },
  { label: "how",   angle: 135,  color: "#06b6d4", kws: ["how to do seo",   "how seo works",    "how much seo costs"] },
  { label: "which", angle: 180,  color: "#8b5cf6", kws: ["which seo tool",  "which seo course", "which seo plugin"  ] },
  { label: "are",   angle: -135, color: "#f43f5e", kws: ["are tools worth", "are audits needed","are backlinks key" ] },
];

// ── Autosuggest preview ───────────────────────────────────────────────────────
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

// ── Feature cards ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: "🔍",
    title: "Question Discovery",
    desc: "Every how, what, why, where and when question your audience searches — sorted by volume.",
    color: "from-violet-500/10",
  },
  {
    icon: "📋",
    title: "Keyword List Builder",
    desc: "Organise into named lists. Export to CSV. Bulk-add from any source.",
    color: "from-blue-500/10",
  },
  {
    icon: "⚔️",
    title: "Competitor Gap",
    desc: "See which keywords competitors rank for that you don't. Find the fastest wins.",
    color: "from-orange-500/10",
  },
  {
    icon: "🤖",
    title: "LLM Visibility",
    desc: "Check if your brand shows up in ChatGPT, Perplexity and Gemini answers.",
    color: "from-emerald-500/10",
  },
  {
    icon: "🅰",
    title: "A–Z Explorer",
    desc: "Every keyword for every letter — with live volume data.",
    color: "from-pink-500/10",
  },
  {
    icon: "📊",
    title: "GSC Integration",
    desc: "Connect Search Console and surface real impressions, clicks and hidden wins.",
    color: "from-cyan-500/10",
  },
];

// ── Spoke wheel SVG ───────────────────────────────────────────────────────────
function SpokeWheel({ keyword = "seo" }: { keyword?: string }) {
  const cx = 350, cy = 320;
  const innerR = 62;
  const offsets = [-14, 0, 14] as const;
  const radii   = [150, 205, 268] as const;

  return (
    <svg viewBox="0 0 700 640" className="w-full select-none" style={{ maxHeight: 520 }}>
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
              const x1  = cx + (innerR + 8)   * Math.cos(rad);
              const y1  = cy + (innerR + 8)   * Math.sin(rad);
              const x2  = cx + radii[i]       * Math.cos(rad);
              const y2  = cy + radii[i]       * Math.sin(rad);
              const tx  = cx + (radii[i] + 4) * Math.cos(rad);
              const ty  = cy + (radii[i] + 4) * Math.sin(rad);
              const anchor = (tx > cx + 8 ? "start" : tx < cx - 8 ? "end" : "middle") as "start" | "end" | "middle";
              const dy = ty > cy + 8 ? 10 : ty < cy - 8 ? -4 : 4;
              return (
                <g key={i}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={s.color} strokeWidth="1" opacity="0.25" />
                  <circle cx={x2} cy={y2} r="4" fill={s.color} opacity="0.6" />
                  <text
                    x={tx + (anchor === "start" ? 7 : anchor === "end" ? -7 : 0)}
                    y={ty + dy}
                    fontSize="9.5" fill="rgba(255,255,255,0.6)" textAnchor={anchor}>
                    {s.kws[i]}
                  </text>
                </g>
              );
            })}
            <text
              x={cx + 90 * Math.cos(baseRad)} y={cy + 90 * Math.sin(baseRad) + 4}
              fontSize="12" fontWeight="800" fill={s.color}
              textAnchor="middle" dominantBaseline="middle" opacity="0.9">
              {s.label}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={innerR} fill="#0b0b18" stroke="rgba(241,91,39,0.55)" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={innerR - 5} fill="rgba(241,91,39,0.12)" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="900" fill="white">{keyword}</text>
      <text x={cx} y={cy + 17} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.35)" letterSpacing="1.5">EXPLORE</text>
    </svg>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const [query, setQuery]         = useState("");
  const [activeTab, setActiveTab] = useState("google");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/register?q=${encodeURIComponent(q)}&platform=${activeTab}`);
  }

  return (
    <main className="ubk-bg min-h-screen text-white overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════
          NAV
      ═══════════════════════════════════════════════════ */}
      <nav className="relative z-30 flex items-center justify-between px-6 md:px-10 py-4 max-w-7xl mx-auto">
        <span className="text-lg font-black tracking-tight ubk-logo">
          Unbound<span className="text-white/50">Keyword</span>
        </span>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-white/55">
          {["Features", "Use cases", "Pricing"].map(l => (
            <Link key={l} href="#" className="hover:text-white transition">{l}</Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-white/60 hover:text-white text-sm font-medium transition hidden sm:block">
            Sign in
          </Link>
          <Link href="/register" className="ubk-btn-primary text-sm font-bold px-5 py-2 rounded-full">
            Get started
          </Link>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════
          HERO — above the fold, ATP-style
          Dark bg + subtle spoke wheel behind text
      ═══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">

        {/* Background decorative wheel */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
          style={{ top: "-10%" }}
        >
          <svg viewBox="0 0 900 900" className="w-[820px] h-[820px] opacity-[0.055]">
            {Array.from({ length: 24 }, (_, i) => {
              const a = (i * 15 * Math.PI) / 180;
              return (
                <line key={i}
                  x1={450} y1={450}
                  x2={450 + 440 * Math.cos(a)}
                  y2={450 + 440 * Math.sin(a)}
                  stroke="white" strokeWidth="1"
                />
              );
            })}
            {[440, 320, 200, 90].map(r => (
              <circle key={r} cx={450} cy={450} r={r} fill="none" stroke="white" strokeWidth="1" />
            ))}
          </svg>
        </div>

        {/* Hero content */}
        {/* Hero content — two-column split */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-6 xl:gap-12 items-end">

            {/* ── Left: text + search ─────────────────── */}
            <div className="flex flex-col items-start text-left pb-14">
              <a href="#" className="ubk-badge inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
                <span className="ubk-dot" />
                New: AI Models available
              </a>

              <h1 className="text-5xl sm:text-6xl md:text-[68px] font-black leading-[1.04] tracking-tight mb-5">
                Discover what people are<br />
                <span className="ubk-orange-accent">asking about</span>…
              </h1>

              <p className="text-white/48 text-lg mb-7 max-w-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.48)" }}>
                Keyword discovery across Google, YouTube, Amazon, TikTok and&nbsp;more&nbsp;—&nbsp;all in one platform.
              </p>

              {/* Platform tabs */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {TABS.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`ubk-tab px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                      activeTab === t.id ? "ubk-tab-active" : ""
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Search form */}
              <form
                onSubmit={handleSearch}
                className="ubk-hero-search flex items-center w-full max-w-xl rounded-xl overflow-hidden"
              >
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Enter a topic, brand or question…"
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-white/35 px-4 py-3 outline-none min-w-0"
                />
                <div className="hidden sm:flex items-center border-l border-white/10 px-3 py-3 text-white/50 text-xs font-medium shrink-0 gap-1">
                  🌐 English
                </div>
                <div className="hidden sm:flex items-center border-l border-white/10 px-3 py-3 text-white/50 text-xs font-medium shrink-0 gap-1">
                  🇺🇸 United States
                </div>
                <button type="submit" className="ubk-search-btn text-sm font-black px-6 py-3 shrink-0">
                  SEARCH
                </button>
              </form>
              <p className="text-white/25 text-xs mt-2">Use 1–3 words for best results</p>
            </div>

            {/* ── Right: person image + floating chips ─ */}
            <div className="relative hidden lg:flex items-end justify-center self-end" style={{ minHeight: 460 }}>
              {/* Warm glow behind the photo */}
              <div
                className="pointer-events-none absolute inset-x-16 bottom-0"
                style={{
                  height: "72%",
                  borderRadius: "50%",
                  background: "radial-gradient(ellipse at 50% 80%, rgba(249,115,22,0.28) 0%, rgba(249,115,22,0.06) 60%, transparent 80%)",
                  filter: "blur(28px)",
                }}
              />

              {/* Floating chips */}
              <div className="ubk-float-chip" style={{ top: 56, left: -8, animationDelay: "0s" }}>
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-orange-400 shrink-0">
                  <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a1 1 0 110 2 1 1 0 010-2zm1 9H7V7h2v5z"/>
                </svg>
                <span><strong className="text-white">8,400</strong> <span style={{ color: "rgba(255,255,255,0.55)" }}>keyword ideas</span></span>
              </div>

              <div className="ubk-float-chip" style={{ top: 140, right: -8, animationDelay: "1.4s" }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-blue-400 shrink-0">
                  <circle cx="8" cy="8" r="6.5"/>
                  <path d="M8 5v3l2 2" strokeLinecap="round"/>
                </svg>
                <span><strong className="text-white">920</strong> <span style={{ color: "rgba(255,255,255,0.55)" }}>questions found</span></span>
              </div>

              <div className="ubk-float-chip" style={{ top: "45%", left: -16, animationDelay: "2.6s" }}>
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-green-400 shrink-0">
                  <path d="M2 12l4-4 3 3 5-7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span><span style={{ color: "rgba(255,255,255,0.55)" }}>SEO opp</span> <strong className="text-white">74 / 100</strong></span>
              </div>

              <div className="ubk-float-chip" style={{ top: "62%", right: -4, animationDelay: "0.8s" }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-purple-400 shrink-0">
                  <rect x="2" y="10" width="2" height="4" rx="0.5"/>
                  <rect x="7" y="6" width="2" height="8" rx="0.5"/>
                  <rect x="12" y="2" width="2" height="12" rx="0.5"/>
                </svg>
                <span><span style={{ color: "rgba(255,255,255,0.55)" }}>A-Z</span> <strong className="text-white">26 letters</strong> <span style={{ color: "rgba(255,255,255,0.55)" }}>mapped</span></span>
              </div>

              {/* Person photo */}
              <img
                src="/joe-headshot.png"
                alt="Joe — keyword research expert"
                className="ubk-hero-person"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>

          </div>
        </div>

        {/* ── 51B Bar chart (immediately below search, still inside hero zone) */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 pb-14">
          <div className="ubk-chart-panel rounded-2xl p-5 md:p-7">

            {/* Chart header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
              <div>
                <div className="text-white/35 text-xs mb-0.5">Daily searches per platform (in billions)</div>
                <div className="text-2xl font-black">51 billion</div>
              </div>
              <div className="ubk-chart-badge rounded-xl px-4 py-3 text-xs max-w-xs">
                There are <span className="text-orange-400 font-bold">51 billion</span> searches daily,
                and only <span className="font-bold text-white">27% are on Google</span>.
              </div>
            </div>

            {/* Bars */}
            <div className="overflow-x-auto">
              <div className="min-w-[520px]">
                <div className="relative" style={{ height: CHART_H + "px" }}>
                  {GRID_VALS.map(v => (
                    <div
                      key={v}
                      className="absolute left-0 right-0 flex items-center pointer-events-none"
                      style={{ bottom: (v / SCALE_MAX) * CHART_H + "px" }}
                    >
                      <span className="text-[9px] text-white/25 w-7 shrink-0 text-right pr-1 leading-none">{v}B</span>
                      <div className="flex-1 border-t border-dashed border-white/[0.07]" />
                    </div>
                  ))}
                  <div className="absolute right-0 bottom-0 flex items-end gap-[3px]" style={{ left: "32px", top: 0 }}>
                    {PLATFORMS.map(p => {
                      const barH = Math.round((p.val / SCALE_MAX) * CHART_H);
                      return (
                        <div key={p.name} className="relative flex-1 flex flex-col items-center justify-end group" title={`${p.name}: ${p.val}B`}>
                          <div
                            className="absolute text-[8px] font-bold text-white rounded px-[3px] leading-tight tabular-nums opacity-0 group-hover:opacity-100 transition"
                            style={{ bottom: barH + 4, background: "#0b0b18", border: "1px solid rgba(255,255,255,0.15)" }}
                          >
                            {p.val}
                          </div>
                          <div
                            className="absolute text-[8px] font-bold text-white rounded px-[3px] leading-tight tabular-nums group-hover:opacity-0 transition"
                            style={{ bottom: barH + 4, background: "#0b0b18", border: "1px solid rgba(255,255,255,0.15)" }}
                          >
                            {p.val}
                          </div>
                          <div
                            className="w-full rounded-t-[3px] cursor-default hover:brightness-125 transition"
                            style={{
                              height: barH,
                              background: p.highlight
                                ? "linear-gradient(to top,#f97316,#fbbf24)"
                                : "#3a3a50",
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Icon row */}
                <div className="flex gap-[3px] mt-2" style={{ paddingLeft: "32px" }}>
                  {PLATFORMS.map(p => (
                    <div key={p.name} className="flex-1 flex justify-center" title={p.name}>
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black text-white shrink-0"
                        style={{ background: p.color }}
                      >
                        {p.abbr.slice(0, 1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 mt-4 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs text-white/45">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "linear-gradient(135deg,#f97316,#fbbf24)" }} />
                Google 27%
              </div>
              <div className="flex items-center gap-2 text-xs text-white/45">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#3a3a50]" />
                Other platforms 73%
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SPOKE WHEEL — "Untapped goldmine"
      ═══════════════════════════════════════════════════ */}
      <section className="ubk-below-fold py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
            <div className="ubk-badge inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-5">
              Visual Keyword Explorer
            </div>
            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-5">
              Discover an{" "}
              <span className="ubk-headline-accent">untapped goldmine</span>{" "}
              of content ideas
            </h2>
            <p className="text-white/50 leading-relaxed mb-6 text-lg">
              Turn any topic into thousands of real questions and phrases your audience searches —
              questions, prepositions, comparisons, A–Z, and more.
            </p>
            <blockquote className="text-white/35 text-sm italic border-l-2 border-purple-500/40 pl-4 mb-8">
              &ldquo;It&rsquo;s a goldmine of consumer insight to create fresh, ultra-useful content
              your customers really want.&rdquo;
            </blockquote>
            <Link href="/register" className="ubk-btn-primary font-bold px-8 py-3 rounded-full inline-block text-sm">
              Start exploring — it&apos;s free
            </Link>
          </div>
          <div className="ubk-vis-strip rounded-3xl p-4 md:p-6">
            <SpokeWheel keyword="keyword" />
            <p className="text-center text-white/20 text-xs mt-1">Questions · Prepositions · Comparisons · A–Z</p>
          </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          AUTOSUGGEST PREVIEW
      ═══════════════════════════════════════════════════ */}
      <section className="ubk-below-fold max-w-6xl mx-auto px-6 pb-14">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black mb-3">
            See exactly what people type —{" "}
            <span className="ubk-headline-accent">autocomplete insights</span>
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto">
            Every autocomplete suggestion, for every letter of the alphabet, for your keyword.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {SUGGEST_CARDS.map(card => (
            <div key={card.prefix} className="ubk-feature-card rounded-2xl p-6">
              <div className="ubk-mock-search flex items-center rounded-xl px-4 py-3 mb-4 gap-3">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white/30 shrink-0" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </svg>
                <span className="text-white/80 text-sm font-medium flex-1">{card.prefix}</span>
                <span className="text-[10px] text-white/25 border border-white/10 rounded px-1.5 py-0.5">Hide</span>
              </div>
              <ul className="flex flex-col gap-0.5">
                {card.items.map((item, i) => (
                  <li
                    key={item}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition ${
                      i === card.highlight ? "bg-white/[0.09]" : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-white/20 shrink-0" stroke="currentColor" strokeWidth={2}>
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
                    </svg>
                    <span className={`text-sm ${i === card.highlight ? "text-white font-semibold" : "text-white/55"}`}>
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

      {/* ═══════════════════════════════════════════════════
          FEATURES GRID
      ═══════════════════════════════════════════════════ */}
      <section className="ubk-below-fold max-w-6xl mx-auto px-6 py-14 border-t border-gray-200">
        <h2 className="text-center text-3xl md:text-4xl font-black mb-3">
          Everything keyword research needs
        </h2>
        <p className="text-center text-white/45 mb-12 text-lg">One platform from first idea to published content.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className={`ubk-feature-card rounded-2xl p-7 flex flex-col gap-4 bg-gradient-to-br ${f.color} to-transparent`}>
              <div className="text-3xl">{f.icon}</div>
              <div>
                <h3 className="font-bold text-base mb-1">{f.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CTA BANNER
      ═══════════════════════════════════════════════════ */}
      <section className="ubk-below-fold px-6 pb-20 max-w-3xl mx-auto text-center">
        <div className="ubk-cta-banner rounded-3xl p-10 md:p-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Anyone can use UnboundKeyword<br />to create <span className="ubk-orange-accent">better content</span>
          </h2>
          <p className="text-white/55 mb-8">No credit card required. Unlimited searches on the free plan.</p>
          <Link href="/register" className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full inline-block">
            Get started for free
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════ */}
      <footer className="ubk-below-fold border-t border-gray-200 py-8 text-center text-sm text-gray-400">
        © 2026 UnBoundKeyword.com · All rights reserved ·{" "}
        <Link href="/privacy" className="hover:text-white/60 transition">Privacy</Link>
        {" · "}
        <Link href="/terms" className="hover:text-white/60 transition">Terms</Link>
      </footer>

    </main>
  );
}
