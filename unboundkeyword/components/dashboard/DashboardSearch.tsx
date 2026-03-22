"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const PLATFORM_TABS = [
  { id: "google",    label: "Google",    color: "#EA4335", icon: "G"  },
  { id: "youtube",   label: "YouTube",   color: "#FF0000", icon: "▶"  },
  { id: "amazon",    label: "Amazon",    color: "#FF9900", icon: "A"  },
  { id: "bing",      label: "Bing",      color: "#008373", icon: "B"  },
  { id: "instagram", label: "Instagram", color: "#C13584", icon: "IG" },
  { id: "tiktok",    label: "TikTok",    color: "#555555", icon: "TT" },
  { id: "chatgpt",   label: "ChatGPT",   color: "#10A37F", icon: "AI" },
];

export default function DashboardSearch() {
  const router = useRouter();
  const [query, setQuery]               = useState("");
  const [activePlatform, setActivePlatform] = useState("google");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/dashboard/discover?q=${encodeURIComponent(q)}`);
  }

  const active = PLATFORM_TABS.find(t => t.id === activePlatform)!;

  return (
    <div className="mb-8 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#f15b27] mb-0.5">
            KEYWORD DISCOVERY
          </div>
          <p className="text-[13px] text-slate-500">
            See what people search across <span className="font-semibold text-slate-700">51 billion</span> daily queries on every major platform
          </p>
        </div>
        {/* Live platform badge */}
        <div
          className="shrink-0 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-sm"
          style={{ background: active.color }}
        >
          <span>{active.icon}</span>
          <span>{active.label}</span>
        </div>
      </div>

      {/* Platform tabs */}
      <div className="px-6 pt-3 pb-0 flex flex-wrap gap-2">
        {PLATFORM_TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActivePlatform(tab.id)}
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition",
              activePlatform === tab.id
                ? "text-white shadow-sm"
                : "text-slate-500 bg-slate-50 border-slate-200 hover:border-slate-300 hover:text-slate-700",
            ].join(" ")}
            style={
              activePlatform === tab.id
                ? { background: tab.color, borderColor: tab.color }
                : {}
            }
          >
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black"
              style={
                activePlatform === tab.id
                  ? { background: "rgba(255,255,255,0.25)" }
                  : { background: tab.color, color: "#fff" }
              }
            >
              {tab.icon.slice(0, 1)}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="px-6 py-4 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:border-[#f15b27] focus-within:ring-2 focus-within:ring-[#f15b27]/10 transition">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Enter a keyword to explore on ${active.label}…`}
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none min-w-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-slate-300 hover:text-slate-500 transition shrink-0"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="submit"
          className="shrink-0 flex items-center gap-2 rounded-xl bg-[#f15b27] hover:bg-[#d94e1f] text-white text-sm font-bold px-5 py-2.5 transition shadow-md shadow-orange-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Discover
        </button>
      </form>

      {/* Quick searches hint */}
      <div className="px-6 pb-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-slate-400 font-medium shrink-0">Try:</span>
        {["coffee subscription", "shopify seo", "local seo", "email marketing", "running shoes"].map(preset => (
          <button
            key={preset}
            type="button"
            onClick={() => { setQuery(preset); router.push(`/dashboard/discover?q=${encodeURIComponent(preset)}`); }}
            className="text-[11px] text-[#f15b27] font-semibold border border-[#f15b27]/25 bg-[#fff3ee] rounded-full px-2.5 py-0.5 hover:bg-[#ffe4d6] transition"
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
