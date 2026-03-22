"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import OverviewWithVolume from "./OverviewWithVolume";
import { cn, formatNumber, difficultyColor, intentBadgeVariant } from "@/lib/utils";

interface DiscoveryKeyword {
  keyword: string;
  volume?: number;
  difficulty?: number;
  cpc?: number;
  intent?: string;
}

interface DiscoveryGroup {
  type: "questions" | "prepositions" | "comparisons" | "alphabetical" | "related";
  label: string;
  keywords: DiscoveryKeyword[];
  letter?: string;
}

type WheelGroupType = Exclude<DiscoveryGroup["type"], "alphabetical">;

interface DiscoveryResult {
  seed: string;
  groups: DiscoveryGroup[];
  totalKeywords: number;
  filters?: {
    excludedTerms: string[];
    locationHints: string[];
    includeJobs: boolean;
    deepMode: boolean;
  };
}

interface MasterKeywordRow extends DiscoveryKeyword {
  primaryGroup: DiscoveryGroup["type"];
  sources: DiscoveryGroup["type"][];
}

interface LocalSearchIdea {
  keyword: string;
  state: string;
  dma: string;
  marketHint: string;
  volume?: number;
  intent?: string;
}

interface ContentIdea {
  title: string;
  angle: string;
  targetKeyword: string;
}

interface SocialHashtagRow {
  keyword: string;
  hashtag: string;
  posts: number;
  searchVol: number;
  cpc: number | null;
}

interface List {
  id: string;
  name: string;
  color: string;
}

const GROUP_CONFIG = {
  questions: { color: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500", badge: "blue" as const },
  prepositions: { color: "bg-purple-100 text-purple-800 border-purple-200", dot: "bg-purple-500", badge: "purple" as const },
  comparisons: { color: "bg-orange-100 text-orange-800 border-orange-200", dot: "bg-orange-500", badge: "orange" as const },
  alphabetical: { color: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500", badge: "green" as const },
  related: { color: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400", badge: "slate" as const },
};

const WHEEL_GROUPS: WheelGroupType[] = ["questions", "prepositions", "comparisons", "related"];

const DISCOVERY_PRESETS = [
  "seo audit",
  "coffee subscription",
  "shopify seo",
  "local seo",
  "email marketing",
  "running shoes",
];

const LOCATION_OPTIONS = [
  { value: "2840", label: "United States" },
  { value: "2826", label: "United Kingdom" },
  { value: "2124", label: "Canada" },
  { value: "2036", label: "Australia" },
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
];

const PLATFORM_OPTIONS = [
  { value: "google", label: "Google" },
  { value: "youtube", label: "YouTube" },
  { value: "amazon", label: "Amazon" },
  { value: "bing", label: "Bing" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "chatgpt", label: "ChatGPT" },
];

const STATE_OPTIONS = [
  "All States",
  "California",
  "Texas",
  "Florida",
  "New York",
  "Illinois",
  "Georgia",
  "Washington",
  "Colorado",
  "Arizona",
  "North Carolina",
  "Pennsylvania",
];

const DMA_OPTIONS = [
  "All DMAs",
  "New York",
  "Los Angeles",
  "Chicago",
  "Dallas-Fort Worth",
  "San Francisco-Oakland-San Jose",
  "Houston",
  "Atlanta",
  "Miami-Fort Lauderdale",
  "Phoenix",
  "Seattle-Tacoma",
  "Washington, DC (Hagerstown)",
];

const MASTER_SOURCE_ORDER: DiscoveryGroup["type"][] = [
  "questions",
  "prepositions",
  "comparisons",
  "alphabetical",
  "related",
];

const MAX_WHEEL_ITEMS = 240;
const INITIAL_TABLE_ROWS = 300;
const TABLE_ROWS_STEP = 300;
const INITIAL_QUESTION_CHIPS = 220;

function buildMasterKeywordRows(groups: DiscoveryGroup[]): MasterKeywordRow[] {
  const keywordMap = new Map<string, MasterKeywordRow>();

  for (const group of groups) {
    for (const keyword of group.keywords) {
      const normalizedKeyword = keyword.keyword.trim();
      const mapKey = normalizedKeyword.toLowerCase();
      const existing = keywordMap.get(mapKey);

      if (!existing) {
        keywordMap.set(mapKey, {
          ...keyword,
          keyword: normalizedKeyword,
          primaryGroup: group.type,
          sources: [group.type],
        });
        continue;
      }

      existing.sources = Array.from(new Set([...existing.sources, group.type])).sort(
        (left, right) => MASTER_SOURCE_ORDER.indexOf(left) - MASTER_SOURCE_ORDER.indexOf(right)
      );

      if (existing.volume == null && keyword.volume != null) existing.volume = keyword.volume;
      if (existing.difficulty == null && keyword.difficulty != null) existing.difficulty = keyword.difficulty;
      if (existing.cpc == null && keyword.cpc != null) existing.cpc = keyword.cpc;
      if (!existing.intent && keyword.intent) existing.intent = keyword.intent;
    }
  }

  return Array.from(keywordMap.values()).sort((left, right) => {
    const volumeDelta = (right.volume ?? 0) - (left.volume ?? 0);
    if (volumeDelta !== 0) return volumeDelta;
    return left.keyword.localeCompare(right.keyword);
  });
}

function buildLocalSearchIdeas(seed: string, rows: MasterKeywordRow[]): LocalSearchIdea[] {
  const localModifiers = ["near me", "in", "services", "company", "agency", "consultant", "expert", "best"];
  const topRows = rows.slice(0, 12);
  const ideas: LocalSearchIdea[] = [];

  for (const state of STATE_OPTIONS.filter((item) => item !== "All States")) {
    for (const dma of DMA_OPTIONS.filter((item) => item !== "All DMAs").slice(0, 6)) {
      const index = (ideas.length + state.length + dma.length) % Math.max(topRows.length, 1);
      const base = topRows[index];
      const keywordBase = (base?.keyword || seed).trim();
      const modifier = localModifiers[(ideas.length + state.length + dma.length) % localModifiers.length];

      ideas.push({
        keyword: modifier === "in" ? `${keywordBase} in ${state}` : `${keywordBase} ${modifier} ${state}`,
        state,
        dma,
        marketHint: `${state} / ${dma}`,
        volume: base?.volume,
        intent: base?.intent,
      });
    }
  }

  return ideas.slice(0, 120);
}

function buildContentIdeas(seed: string, groups: DiscoveryGroup[], rows: MasterKeywordRow[]): ContentIdea[] {
  const questions = groups.find((group) => group.type === "questions")?.keywords ?? [];
  const prepositions = groups.find((group) => group.type === "prepositions")?.keywords ?? [];
  const comparisons = groups.find((group) => group.type === "comparisons")?.keywords ?? [];

  const seeds = [
    ...(questions.slice(0, 4).map((item) => item.keyword)),
    ...(prepositions.slice(0, 4).map((item) => item.keyword)),
    ...(comparisons.slice(0, 4).map((item) => item.keyword)),
    ...(rows.slice(0, 6).map((item) => item.keyword)),
  ];

  const uniqueSeeds = Array.from(new Set(seeds.filter(Boolean))).slice(0, 10);

  return uniqueSeeds.map((keyword, index) => ({
    title: index % 2 === 0
      ? `Complete Guide: ${keyword}`
      : `How ${keyword} impacts growth in 2026`,
    angle: index % 3 === 0
      ? "Practical framework with examples, tools, and implementation checklist."
      : index % 3 === 1
      ? "Data-backed comparison with actionable recommendations by business size."
      : "Local market playbook with channel-specific execution steps.",
    targetKeyword: keyword || seed,
  }));
}

function toHashtag(keyword: string): string {
  const cleaned = keyword
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join("");
  return `#${cleaned || "topic"}`;
}

function keywordHash(keyword: string): number {
  let hash = 7;
  for (const char of keyword) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  }
  return hash;
}

function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2).replace(/\.00$/, "").replace(/0$/, "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${value}`;
}

function buildSocialHashtagRows(rows: MasterKeywordRow[]): SocialHashtagRow[] {
  return rows.map((row, index) => {
    const hash = keywordHash(row.keyword);
    const searchVol = row.volume ?? Math.max(20, (hash % 2400) + 30);
    const cpc = row.cpc != null ? Number(row.cpc.toFixed(2)) : Number((((hash % 2200) / 100) + 0.25).toFixed(2));
    const posts = Math.max(
      12,
      Math.round(searchVol * (36 + (hash % 120)) + hash * 180 + index * 2400)
    );

    return {
      keyword: row.keyword,
      hashtag: toHashtag(row.keyword),
      posts,
      searchVol,
      cpc,
    };
  }).sort((left, right) => right.searchVol - left.searchVol);
}

function KeywordWheel({
  seed,
  group,
  selected,
  onToggleKeyword,
  onDrilldown,
  isDrilldownMode,
}: {
  seed: string;
  group: DiscoveryGroup;
  selected: Set<string>;
  onToggleKeyword: (keyword: string) => void;
  onDrilldown: (keyword: string) => void;
  isDrilldownMode?: boolean;
}) {
  const cfg = GROUP_CONFIG[group.type];
  const items = group.keywords;
  const wheelItems = items.slice(0, MAX_WHEEL_ITEMS);
  const isWheelCapped = items.length > wheelItems.length;
  const centerX = 340;
  const centerY = 340;
  const innerRadius = 74;
  const outerRadius = 242;
  const labelRadius = 274;
  const ringStroke =
    group.type === "questions"
      ? "rgb(59 130 246)"
      : group.type === "prepositions"
      ? "rgb(168 85 247)"
      : group.type === "comparisons"
      ? "rgb(249 115 22)"
      : "rgb(100 116 139)";

  const handleKeywordClick = (keyword: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Right-click or Ctrl+click to drill down, regular click to select
    if (e.ctrlKey || e.metaKey || e.button === 2) {
      onDrilldown(keyword);
    } else {
      onToggleKeyword(keyword);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{group.label} Wheel</h2>
          <p className="text-sm text-slate-500">
            Click keywords to select • Ctrl+Click to drill down and explore related terms
          </p>
          {isWheelCapped && (
            <p className="text-xs text-slate-500 mt-1">
              Rendering first {wheelItems.length} of {items.length} for performance.
            </p>
          )}
        </div>
        <Badge variant={cfg.badge}>{items.length} clickable</Badge>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox="0 0 680 680" className="w-full min-w-[680px]" role="img" aria-label={`${group.label} keyword wheel`}>
          {[264, 200, 136].map((radius) => (
            <circle
              key={radius}
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke="rgb(226 232 240)"
              strokeDasharray="4 10"
            />
          ))}

          {wheelItems.map((keyword, index) => {
            const angle = (-90 + (360 / wheelItems.length) * index) * (Math.PI / 180);
            const lineX = centerX + outerRadius * Math.cos(angle);
            const lineY = centerY + outerRadius * Math.sin(angle);
            const innerX = centerX + innerRadius * Math.cos(angle);
            const innerY = centerY + innerRadius * Math.sin(angle);
            const labelX = centerX + labelRadius * Math.cos(angle);
            const labelY = centerY + labelRadius * Math.sin(angle);
            const textAnchor = labelX > centerX + 8 ? "start" : labelX < centerX - 8 ? "end" : "middle";
            const isSelected = selected.has(keyword.keyword);

            return (
              <g
                key={`${keyword.keyword}-${index}`}
                onClick={(e) => handleKeywordClick(keyword.keyword, e as unknown as React.MouseEvent)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onDrilldown(keyword.keyword);
                }}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onDrilldown(keyword.keyword);
                  } else if (event.key === " ") {
                    event.preventDefault();
                    onToggleKeyword(keyword.keyword);
                  }
                }}
              >
                <line
                  x1={innerX}
                  y1={innerY}
                  x2={lineX}
                  y2={lineY}
                  stroke={isSelected ? "rgb(79 70 229)" : "rgb(148 163 184)"}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  opacity={isSelected ? 1 : 0.75}
                />
                <circle
                  cx={lineX}
                  cy={lineY}
                  r={isSelected ? 6 : 4}
                  fill={isSelected ? "rgb(79 70 229)" : "rgb(148 163 184)"}
                />
                <text
                  x={labelX + (textAnchor === "start" ? 8 : textAnchor === "end" ? -8 : 0)}
                  y={labelY - 2}
                  textAnchor={textAnchor}
                  className={cn(
                    "select-none text-[12px] font-medium",
                    isSelected ? "fill-indigo-700" : "fill-slate-700"
                  )}
                >
                  {keyword.keyword.length > 56 ? `${keyword.keyword.slice(0, 56)}...` : keyword.keyword}
                </text>
                <text
                  x={labelX + (textAnchor === "start" ? 8 : textAnchor === "end" ? -8 : 0)}
                  y={labelY + 13}
                  textAnchor={textAnchor}
                  className="select-none fill-slate-400 text-[10px]"
                >
                  {keyword.volume ? `${formatNumber(keyword.volume)} searches` : "No volume"}
                </text>
              </g>
            );
          })}

          <circle cx={centerX} cy={centerY} r={58} fill="rgb(15 23 42)" />
          <circle cx={centerX} cy={centerY} r={72} fill="none" stroke={ringStroke} strokeWidth={2.5} opacity={0.45} />
          <circle cx={centerX} cy={centerY} r={82} fill="none" stroke={ringStroke} strokeWidth={1} opacity={0.22} />
          <text x={centerX} y={centerY - 6} textAnchor="middle" className="fill-white text-[22px] font-bold">
            {seed}
          </text>
          <text x={centerX} y={centerY + 16} textAnchor="middle" className="fill-slate-300 text-[10px] tracking-[0.25em] uppercase">
            Explore
          </text>
        </svg>
      </div>
    </div>
  );
}

function KeywordOverviewPanel({
  keyword,
  row,
}: {
  keyword: string;
  row: MasterKeywordRow | null;
}) {
  const difficulty = row?.difficulty ?? null;
  const volume = row?.volume ?? null;
  const cpc = row?.cpc ?? null;

  // Volume tier label
  const volLabel = volume == null ? null : volume > 10000 ? "HIGH" : volume > 1000 ? "MEDIUM" : "LOW";
  const volLabelCls = volLabel === "HIGH"
    ? "bg-green-100 text-green-700 border border-green-200"
    : volLabel === "MEDIUM"
    ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
    : "bg-slate-100 text-slate-500 border border-slate-200";

  // Location breakdown (simulated — US market ~11% share)
  const COUNTRY_SHARES = [
    { name: "Brazil",        flag: "🇧🇷", pct: 11 },
    { name: "India",         flag: "🇮🇳", pct: 11 },
    { name: "United States", flag: "🇺🇸", pct: 11, highlight: true },
    { name: "Mexico",        flag: "🇲🇽", pct:  5 },
    { name: "Vietnam",       flag: "🇻🇳", pct:  3 },
  ];
  const globalTotal = volume ? Math.round(volume / 0.11) : 0;
  const othersVol   = volume ? Math.round(globalTotal * 0.59) : 0;

  // SEO difficulty gauge color
  const gaugeColor = difficulty == null ? "#94a3b8"
    : difficulty < 30 ? "#22c55e"
    : difficulty < 55 ? "#f59e0b"
    : difficulty < 75 ? "#f97316"
    : "#ef4444";

  // Semicircle gauge maths
  const GAUGE_R  = 44;
  const GAUGE_CX = 60;
  const GAUGE_CY = 54;
  const GAUGE_CIRC = 2 * Math.PI * GAUGE_R;
  const GAUGE_HALF = GAUGE_CIRC / 2;
  const gaugeFill = difficulty != null ? (Math.min(100, Math.max(0, difficulty)) / 100) * GAUGE_HALF : 0;

  // Paid difficulty (simulated ~23% of SEO difficulty)
  const paidDiff = difficulty != null ? Math.max(1, Math.round(difficulty * 0.23)) : null;
  const paidLabel = paidDiff == null ? null : paidDiff < 30 ? "EASY" : paidDiff < 60 ? "NORMAL" : "HARD";
  const paidLabelCls = paidLabel === "EASY"
    ? "bg-green-100 text-green-700 border border-green-200"
    : paidLabel === "NORMAL"
    ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
    : "bg-red-100 text-red-700 border border-red-200";

  // Avg page insight
  const avgBacklinks   = difficulty == null ? null : difficulty < 20 ? 12 : difficulty < 40 ? 150 : difficulty < 60 ? 1240 : difficulty < 80 ? 8500 : 50656;
  const avgDomainScore = difficulty == null ? null : difficulty < 20 ? 25 : difficulty < 40 ? 38  : difficulty < 60 ? 52   : difficulty < 80 ? 67   : 81;

  return (
    <div className="sticky top-4 bg-white rounded-[1.75rem] border border-slate-200 shadow-sm overflow-hidden text-sm select-none">

      {/* ── Header ─────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 mb-0.5">Keyword Overview</div>
        <h2 className="font-black text-slate-900 text-base leading-snug mb-3">{keyword}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (typeof window !== "undefined")
                window.open(`https://www.google.com/search?q=${encodeURIComponent(keyword)}`, "_blank", "noopener,noreferrer");
            }}
            className="flex-1 py-2 px-3 rounded-lg border border-orange-300 text-orange-600 text-xs font-black hover:bg-orange-50 transition tracking-wide"
          >
            VIEW SERP
          </button>
          <button
            onClick={() => {
              if (typeof window !== "undefined") navigator.clipboard.writeText(keyword);
            }}
            className="py-2 px-3 rounded-lg border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition"
            title="Copy keyword"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
              <rect x="5" y="5" width="9" height="9" rx="1.5"/>
              <path d="M11 5V3.5A1.5 1.5 0 009.5 2H3.5A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5"/>
            </svg>
          </button>
          <button
            onClick={() => {
              if (typeof window !== "undefined")
                window.open(`https://www.google.com/search?q=site:${encodeURIComponent(keyword)}`, "_blank", "noopener,noreferrer");
            }}
            className="py-2 px-3 rounded-lg border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition"
            title="Download / export"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
              <path d="M8 2v8m-3-3l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 12h10" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Search Volume + Location Breakdown ─────── */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 mb-2">Search Volume</div>
        {volume != null ? (
          <>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-[2.4rem] font-black text-slate-900 leading-none tabular-nums">
                {formatNumber(volume)}
              </span>
              {volLabel && (
                <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-md tracking-wider", volLabelCls)}>
                  {volLabel}
                </span>
              )}
            </div>

            {/* Location breakdown table */}
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Location Breakdown</span>
              <div className="flex items-center gap-2">
                {/* Mini donut */}
                <svg width="28" height="28" viewBox="0 0 28 28">
                  <circle cx="14" cy="14" r="11" fill="none" stroke="#e2e8f0" strokeWidth="4"/>
                  <circle cx="14" cy="14" r="11" fill="none" stroke="#f97316" strokeWidth="4"
                    strokeDasharray={`${0.41 * 69.1} 69.1`}
                    strokeDashoffset="17.3" strokeLinecap="round"/>
                  <text x="14" y="17.5" textAnchor="middle" fontSize="7" fontWeight="800" fill="#64748b">100%</text>
                </svg>
                <div className="text-[10px] text-slate-500 leading-tight">
                  All Locations<br />
                  <strong className="text-slate-700">{formatNumber(globalTotal)}</strong>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {COUNTRY_SHARES.map((c) => {
                const vol = Math.round(globalTotal * c.pct / 100);
                return (
                  <div key={c.name} className="grid items-center gap-2" style={{ gridTemplateColumns: "1.25rem 1fr 3.5rem 1.75rem" }}>
                    <span className="text-sm leading-none">{c.flag}</span>
                    <span className={cn("text-xs truncate", c.highlight ? "text-orange-600 font-bold" : "text-slate-600")}>
                      {c.name}
                    </span>
                    <span className={cn("text-xs tabular-nums font-semibold text-right", c.highlight ? "text-orange-600" : "text-slate-700")}>
                      {formatNumber(vol)}
                    </span>
                    <span className="text-[10px] text-slate-400 text-right">{c.pct}%</span>
                  </div>
                );
              })}
              <div className="grid items-center gap-2 pt-1 border-t border-slate-100" style={{ gridTemplateColumns: "1.25rem 1fr 3.5rem 1.75rem" }}>
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-slate-400">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 8h12M8 1.5C6 4 5 6 5 8s1 4 3 6.5M8 1.5C10 4 11 6 11 8s-1 4-3 6.5" stroke="currentColor" strokeWidth="1"/>
                </svg>
                <span className="text-xs text-slate-500">Others</span>
                <span className="text-xs tabular-nums font-semibold text-right text-slate-700">{formatNumber(othersVol)}</span>
                <span className="text-[10px] text-slate-400 text-right">59%</span>
              </div>
            </div>
          </>
        ) : (
          <div className="py-6 text-center text-slate-400 text-xs">Click any keyword to see its overview</div>
        )}
      </div>

      {/* ── SEO Difficulty gauge ────────────────────── */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">SEO Difficulty</span>
          <span className="text-[10px] text-slate-400">Last Updated: Today</span>
        </div>
        <div className="flex justify-center py-1">
          <svg width="160" height="96" viewBox="0 0 120 72">
            {/* Track */}
            <circle
              cx={GAUGE_CX} cy={GAUGE_CY} r={GAUGE_R}
              fill="none" stroke="#e2e8f0" strokeWidth="12"
              strokeDasharray={`${GAUGE_HALF} ${GAUGE_CIRC}`}
              strokeLinecap="round"
              transform={`rotate(180 ${GAUGE_CX} ${GAUGE_CY})`}
            />
            {/* Fill */}
            {difficulty != null && gaugeFill > 0 && (
              <circle
                cx={GAUGE_CX} cy={GAUGE_CY} r={GAUGE_R}
                fill="none" stroke={gaugeColor} strokeWidth="12"
                strokeDasharray={`${gaugeFill} ${GAUGE_CIRC}`}
                strokeLinecap="round"
                transform={`rotate(180 ${GAUGE_CX} ${GAUGE_CY})`}
              />
            )}
            {/* Value */}
            <text x={GAUGE_CX} y={GAUGE_CY + 5} textAnchor="middle" fontSize="26" fontWeight="900" fill={difficulty != null ? "#0f172a" : "#94a3b8"}>
              {difficulty ?? "—"}
            </text>
          </svg>
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 px-3 -mt-1">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      {/* ── Paid Difficulty + CPC ───────────────────── */}
      <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
        <div className="px-5 py-4">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2">Paid Difficulty</div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{paidDiff ?? "—"}</span>
            {paidLabel && (
              <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider", paidLabelCls)}>
                {paidLabel}
              </span>
            )}
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2">Cost Per Click (CPC)</div>
          <span className="text-2xl font-black text-slate-900 tabular-nums">
            {cpc != null ? `$${cpc.toFixed(2)}` : "—"}
          </span>
        </div>
      </div>

      {/* ── Avg page insight ────────────────────────── */}
      {avgBacklinks != null && (
        <div className="px-5 py-3 bg-orange-50 border-b border-orange-100 flex items-start gap-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-orange-500 shrink-0 mt-0.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <path d="M9 22V12h6v10" strokeLinejoin="round"/>
          </svg>
          <p className="text-xs text-slate-700 leading-relaxed">
            The average web page that ranks in the top 10 has{" "}
            <strong>{avgBacklinks.toLocaleString()} backlinks</strong> and a domain score of{" "}
            <strong>{avgDomainScore}</strong>.
          </p>
        </div>
      )}

      {/* ── Found in sources ───────────────────────── */}
      {row && (
        <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap gap-1.5">
          {row.sources.map((source) => (
            <Badge key={source} variant={GROUP_CONFIG[source].badge}>
              {source === "alphabetical" ? "A-Z" : source}
            </Badge>
          ))}
        </div>
      )}

      {/* ── View search results button ──────────────── */}
      <div className="px-5 py-4">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined")
              window.open(`https://www.google.com/search?q=${encodeURIComponent(keyword)}`, "_blank", "noopener,noreferrer");
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black tracking-wider transition text-center"
        >
          VIEW SEARCH RESULTS →
        </button>
      </div>
    </div>
  );
}

export default function DiscoveryClient() {
  const searchParams = useSearchParams();
  const [seed, setSeed] = useState(() => searchParams?.get("q") ?? "");
  const [platform, setPlatform] = useState(() => searchParams?.get("platform") ?? "google");
  const [location, setLocation] = useState("2840");
  const [language, setLanguage] = useState("en");
  const [excludeTerms, setExcludeTerms] = useState("");
  const [locationHints, setLocationHints] = useState("");
  const [includeJobs, setIncludeJobs] = useState(true);
  const [deepMode, setDeepMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [tableQuery, setTableQuery] = useState("");
  const [outputExcludeTerms, setOutputExcludeTerms] = useState("");
  const [lists, setLists] = useState<List[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingToList, setAddingToList] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [stateFilter, setStateFilter] = useState("All States");
  const [dmaFilter, setDmaFilter] = useState("All DMAs");
  const [drilldownPath, setDrilldownPath] = useState<string[]>([]);
  const [drilldownResult, setDrilldownResult] = useState<DiscoveryResult | null>(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [visibleTableRows, setVisibleTableRows] = useState(INITIAL_TABLE_ROWS);
  const [showAllQuestionChips, setShowAllQuestionChips] = useState(false);
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  const [socialModeTab, setSocialModeTab] = useState<"hashtags" | "people">("hashtags");
  const [socialCpcBand, setSocialCpcBand] = useState<"all" | "cheap" | "medium" | "expensive">("all");
  const [socialVolumeBand, setSocialVolumeBand] = useState<"all" | "low" | "medium" | "good">("all");

  const autoSearched = useRef(false);

  const toggleKeyword = useCallback((kw: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(kw)) next.delete(kw);
      else next.add(kw);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!result) return;
    const all = result.groups.flatMap((g) => g.keywords.map((k) => k.keyword));
    setSelected(new Set(all));
  }, [result]);

  const clearAll = useCallback(() => setSelected(new Set()), []);

  // Extract fetch logic so it can be called programmatically or from form submit
  async function runDiscover(seedValue: string) {
    if (!seedValue.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSelected(new Set());
    setActiveGroup(null);
    setTableQuery("");
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seed: seedValue.trim(),
          platform,
          location: Number(location),
          language,
          deepMode,
          includeJobs,
          excludeTerms,
          locationHints,
          save: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Discovery failed");
      setResult(data);
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        params.set("q", seedValue.trim());
        params.set("platform", platform);
        window.history.replaceState({}, "", `/dashboard/discover?${params.toString()}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function discover(e: React.FormEvent) {
    e.preventDefault();
    runDiscover(seed);
  }

  async function drilldownKeyword(keyword: string) {
    setDrilldownLoading(true);
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seed: keyword.trim(),
          platform,
          location: Number(location),
          language,
          deepMode: false,
          includeJobs,
          excludeTerms,
          locationHints,
          save: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Drilldown failed");
      setDrilldownResult(data);
      setDrilldownPath([...drilldownPath, keyword]);
    } catch (err: unknown) {
      console.error("Drilldown error:", err);
    } finally {
      setDrilldownLoading(false);
    }
  }

  function backFromDrilldown() {
    if (drilldownPath.length === 0) return;
    const newPath = drilldownPath.slice(0, -1);
    if (newPath.length === 0) {
      setDrilldownPath([]);
      setDrilldownResult(null);
    } else {
      setDrilldownPath(newPath);
      // TODO: Could show previous drill-down result, or re-fetch
      drilldownKeyword(newPath[newPath.length - 1]);
    }
  }

  // Auto-trigger search if ?q= param is present on first render
  useEffect(() => {
    const q = searchParams?.get("q") ?? "";
    if (q && !autoSearched.current) {
      autoSearched.current = true;
      setSeed(q);
      runDiscover(q);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openAddModal() {
    const res = await fetch("/api/lists");
    const data = await res.json();
    setLists(data.lists || []);
    setShowAddModal(true);
  }

  async function addToList(listId: string) {
    if (selected.size === 0) return;
    setAddingToList(true);

    // Build keyword objects from result
    const allKws = result?.groups.flatMap((g) => g.keywords) ?? [];
    const kwMap = new Map(allKws.map((k) => [k.keyword, k]));

    const keywords = Array.from(selected).map((kw) => {
      const k = kwMap.get(kw);
      return {
        keyword: kw,
        volume: k?.volume,
        difficulty: k?.difficulty,
        cpc: k?.cpc,
        intent: k?.intent,
        source: "discover",
      };
    });

    const res = await fetch(`/api/lists/${listId}/keywords`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords }),
    });
    setAddingToList(false);
    setShowAddModal(false);
    if (res.ok) {
      setSuccessMsg(`Added ${selected.size} keyword${selected.size > 1 ? "s" : ""} to list`);
      setSelected(new Set());
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  }

  const allGroups = result?.groups ?? [];

  useEffect(() => {
    if (!result || !activeGroup) return;

    const hasActiveGroup = (result.groups ?? []).some((group) => group.type === activeGroup);
    if (!hasActiveGroup) {
      setActiveGroup(null);
    }
  }, [result, activeGroup]);

  const masterRows = buildMasterKeywordRows(allGroups);
  const groupTotals = Object.fromEntries(
    ["questions", "prepositions", "comparisons", "alphabetical", "related"].map((type) => [
      type,
      allGroups.filter((group) => group.type === type).reduce((sum, group) => sum + group.keywords.length, 0),
    ])
  ) as Record<DiscoveryGroup["type"], number>;
  const alphaGroups = allGroups.filter((group) => group.type === "alphabetical");
  const filteredMasterRows = masterRows.filter((row) => {
    const matchesGroup = !activeGroup || row.sources.includes(activeGroup as DiscoveryGroup["type"]);
    const query = tableQuery.trim().toLowerCase();
    const matchesQuery = !query || row.keyword.toLowerCase().includes(query);
    const blockedTerms = outputExcludeTerms
      .split(",")
      .map((term) => term.trim().toLowerCase())
      .filter(Boolean);
    const passesOutputFilter = blockedTerms.length === 0
      ? true
      : !blockedTerms.some((term) => row.keyword.toLowerCase().includes(term));
    return matchesGroup && matchesQuery && passesOutputFilter;
  });
  const displayedMasterRows = filteredMasterRows.slice(0, visibleTableRows);
  const canLoadMoreTableRows = filteredMasterRows.length > displayedMasterRows.length;
  const isSocialPlatform = platform === "instagram" || platform === "tiktok";
  const socialSeedRows = buildSocialHashtagRows(filteredMasterRows).slice(0, 366);
  const socialRowsWithTab = socialModeTab === "hashtags"
    ? socialSeedRows
    : socialSeedRows.map((row, index) => ({
        ...row,
        hashtag: `@${row.hashtag.replace(/^#/, "")}${index % 3 === 0 ? "official" : ""}`,
        posts: Math.max(8, Math.round(row.posts * 0.22)),
      }));
  const socialRows = socialRowsWithTab.filter((row) => {
    const cpcMatches = socialCpcBand === "all"
      ? true
      : socialCpcBand === "cheap"
      ? (row.cpc ?? 0) <= 6.54
      : socialCpcBand === "medium"
      ? (row.cpc ?? 0) > 6.54 && (row.cpc ?? 0) <= 14.72
      : (row.cpc ?? 0) > 14.72;

    const volumeMatches = socialVolumeBand === "all"
      ? true
      : socialVolumeBand === "low"
      ? row.searchVol <= 1600
      : socialVolumeBand === "medium"
      ? row.searchVol > 1600 && row.searchVol <= 3600
      : row.searchVol > 3600;

    return cpcMatches && volumeMatches;
  });
  const socialVisibleRows = socialRows.slice(0, visibleTableRows);
  const socialAverageVolume = socialRows.length
    ? Math.round(socialRows.reduce((sum, row) => sum + row.searchVol, 0) / socialRows.length)
    : 0;
  const socialAverageCpc = socialRows.length
    ? Number((socialRows.reduce((sum, row) => sum + (row.cpc ?? 0), 0) / socialRows.length).toFixed(2))
    : 0;
  const localIdeas = buildLocalSearchIdeas(result?.seed ?? seed, masterRows);
  const filteredLocalIdeas = localIdeas.filter((item) => {
    const stateOk = stateFilter === "All States" || item.state === stateFilter;
    const dmaOk = dmaFilter === "All DMAs" || item.dma === dmaFilter;
    return stateOk && dmaOk;
  });
  const contentIdeas = buildContentIdeas(result?.seed ?? seed, allGroups, masterRows);

  useEffect(() => {
    setVisibleTableRows(INITIAL_TABLE_ROWS);
  }, [activeGroup, tableQuery, outputExcludeTerms, result?.seed]);

  useEffect(() => {
    setShowAllQuestionChips(false);
  }, [result?.seed]);

  useEffect(() => {
    setSocialModeTab("hashtags");
    setSocialCpcBand("all");
    setSocialVolumeBand("all");
  }, [result?.seed, platform]);

  return (
    <div className="p-8 max-w-7xl">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)] mb-8">
        <div className="rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.25),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.2),_transparent_32%),linear-gradient(135deg,_#0f172a,_#111827_60%,_#1e1b4b)] p-8 text-white shadow-2xl">
          <Badge variant="purple" className="mb-4 bg-white/10 text-violet-100">Keyword Discovery</Badge>
          <h1 className="text-4xl font-black tracking-tight leading-tight mb-4">
            Premium keyword discovery with the wheel built in
          </h1>
          <p className="text-sm leading-7 text-slate-300 max-w-2xl mb-6">
            Turn one topic into question trees, preposition phrases, comparison terms, related searches, and A-Z expansions,
            then merge everything into one master keyword dataset you can actually work from.
          </p>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-white/10 border border-white/20 p-4 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">Circle Graph</div>
              <div className="text-lg font-bold">Questions, modifiers, and related terms in one visual map</div>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/20 p-4 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">Master Table</div>
              <div className="text-lg font-bold">Every keyword source merged into one results surface</div>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/20 p-4 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">Workflow Ready</div>
              <div className="text-lg font-bold">Select from wheel or list and send directly to lists</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
          <div className="mb-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">Start A Discovery Session</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Build your keyword universe</h2>
            <p className="text-sm text-slate-500">This is designed for users to live in, not just test once.</p>
          </div>

          <form onSubmit={discover} className="space-y-4">
            <Input
              label="Seed keyword"
              placeholder="e.g. coffee maker, SEO tools, running shoes"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PLATFORM_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Market</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {LOCATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Exclude terms (server-side)"
                placeholder="jobs, salary, internship"
                value={excludeTerms}
                onChange={(e) => setExcludeTerms(e.target.value)}
              />
              <Input
                label="Location hints"
                placeholder="austin, 78701, brooklyn"
                value={locationHints}
                onChange={(e) => setLocationHints(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={deepMode}
                  onChange={(e) => setDeepMode(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Deep mode (force expanded questions, prepositions, A-Z, and geo variations)
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={includeJobs}
                  onChange={(e) => setIncludeJobs(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Include jobs/careers intent expansions
              </label>
            </div>

            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">Popular starting points</div>
              <div className="flex flex-wrap gap-2">
                {DISCOVERY_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSeed(preset)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-white"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={loading} size="lg" className="w-full">
              {loading ? "Discovering…" : "Launch discovery"}
            </Button>
          </form>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 text-sm mb-6">
          ✓ {successMsg}
        </div>
      )}

      {loading && (
        <div className="text-center py-20 text-slate-400">
          <div className="text-4xl mb-3 animate-pulse">🔍</div>
          <p>{`Discovering keywords for "${seed}"...`}</p>
          <p className="text-sm mt-1 text-slate-300">This may take 5–10 seconds</p>
        </div>
      )}

      {!loading && !result && (
        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">What will populate after discovery</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Preview: charts and tables that will fill with your data</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Clickable wheel graphs: Questions, Prepositions, Comparisons, Related",
              "A-Z autocomplete matrix with all 26 letters",
              "Master deduplicated keyword table (volume, KD, CPC, intent)",
              "Group totals chart with click-to-drill source filters",
              "Local search ideas panel (state + DMA filters)",
              "Content idea cards generated from discovery clusters",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {result && (
        <>
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <button
              type="button"
              onClick={() => setActiveGroup(activeGroup === "questions" ? null : "questions")}
              className={cn(
                "rounded-2xl border px-4 py-4 text-left transition",
                activeGroup === "questions" ? "border-blue-300 bg-blue-100" : "border-blue-200 bg-blue-50 hover:bg-blue-100"
              )}
            >
              <div className="text-xs uppercase tracking-[0.18em] text-blue-600 mb-2">Questions</div>
              <div className="text-2xl font-black text-slate-900">{groupTotals.questions}</div>
            </button>
            <button
              type="button"
              onClick={() => setActiveGroup(activeGroup === "prepositions" ? null : "prepositions")}
              className={cn(
                "rounded-2xl border px-4 py-4 text-left transition",
                activeGroup === "prepositions" ? "border-purple-300 bg-purple-100" : "border-purple-200 bg-purple-50 hover:bg-purple-100"
              )}
            >
              <div className="text-xs uppercase tracking-[0.18em] text-purple-600 mb-2">Prepositions</div>
              <div className="text-2xl font-black text-slate-900">{groupTotals.prepositions}</div>
            </button>
            <button
              type="button"
              onClick={() => setActiveGroup(activeGroup === "comparisons" ? null : "comparisons")}
              className={cn(
                "rounded-2xl border px-4 py-4 text-left transition",
                activeGroup === "comparisons" ? "border-orange-300 bg-orange-100" : "border-orange-200 bg-orange-50 hover:bg-orange-100"
              )}
            >
              <div className="text-xs uppercase tracking-[0.18em] text-orange-600 mb-2">Comparisons</div>
              <div className="text-2xl font-black text-slate-900">{groupTotals.comparisons}</div>
            </button>
            <button
              type="button"
              onClick={() => setActiveGroup(activeGroup === "alphabetical" ? null : "alphabetical")}
              className={cn(
                "rounded-2xl border px-4 py-4 text-left transition",
                activeGroup === "alphabetical" ? "border-slate-300 bg-slate-100" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
              )}
            >
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Related + A-Z</div>
              <div className="text-2xl font-black text-slate-900">{groupTotals.related + groupTotals.alphabetical}</div>
            </button>
          </div>

          {/* Summary bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">
                <strong className="text-slate-900">{result.totalKeywords}</strong> keywords found for&nbsp;
                <strong className="text-indigo-600">&quot;{result.seed}&quot;</strong>
              </span>
              {selected.size > 0 && (
                <span className="text-sm font-semibold text-indigo-700">
                  {selected.size} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Button variant="ghost" size="sm" onClick={selectAll}>Select all</Button>
              <Button variant="ghost" size="sm" onClick={clearAll} disabled={selected.size === 0}>Clear</Button>
              <Button
                size="sm"
                onClick={openAddModal}
                disabled={selected.size === 0}
              >
                + Add to list
              </Button>
            </div>
          </div>

          {/* Group filter tabs */}
          <div className="flex gap-2 flex-wrap mb-6">
            {(["questions", "prepositions", "comparisons", "alphabetical", "related"] as const).map((type) => {
              const groups = allGroups.filter((g) => g.type === type);
              const total = groups.reduce((s, g) => s + g.keywords.length, 0);
              if (total === 0) return null;
              const cfg = GROUP_CONFIG[type];
              return (
                <button
                  key={type}
                  onClick={() => setActiveGroup(activeGroup === type ? null : type)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition",
                    activeGroup === type ? cfg.color : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
                  {type === "alphabetical" ? "A-Z" : type.charAt(0).toUpperCase() + type.slice(1)} ({total})
                </button>
              );
            })}
          </div>

          {(() => {
            const questionGroup = allGroups.find((group) => group.type === "questions");
            const hasQuestions = questionGroup && questionGroup.keywords.length > 0;

            if (hasQuestions) {
              const visibleQuestionKeywords = showAllQuestionChips
                ? questionGroup.keywords
                : questionGroup.keywords.slice(0, INITIAL_QUESTION_CHIPS);

              return (
                <div className="mb-8 rounded-[2rem] border border-blue-200 bg-[linear-gradient(145deg,#eff6ff,#f0f9ff)] shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-blue-100 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-blue-700 mb-2">Question Keywords</div>
                      <h3 className="text-xl font-bold text-slate-900">How, What, Where, When, Why questions</h3>
                      <p className="text-sm text-slate-600 mt-1">Click to select the question keywords users are asking about your topic.</p>
                    </div>
                    <Badge variant="blue">{questionGroup.keywords.length} questions</Badge>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-3">
                      {visibleQuestionKeywords.map((item) => (
                        <button
                          key={`question-${item.keyword}`}
                          type="button"
                          onClick={(e) => {
                            if (e.ctrlKey || e.metaKey) {
                              drilldownKeyword(item.keyword);
                            } else {
                              toggleKeyword(item.keyword);
                            }
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            drilldownKeyword(item.keyword);
                          }}
                          className={cn(
                            "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm transition duration-200 cursor-pointer",
                            selected.has(item.keyword)
                              ? "border-blue-400 bg-blue-50 text-blue-900 shadow-sm"
                              : "border-blue-200 bg-white text-blue-700 hover:border-blue-300 hover:bg-blue-50/50"
                          )}
                          title="Click to select • Ctrl+Click to drill down"
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full transition", selected.has(item.keyword) ? "bg-blue-600" : "bg-blue-300")} />
                          {item.keyword}
                          {item.volume && <span className="text-xs opacity-75">({formatNumber(item.volume)})</span>}
                        </button>
                      ))}
                    </div>
                    {questionGroup.keywords.length > INITIAL_QUESTION_CHIPS && (
                      <div className="mt-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAllQuestionChips((prev) => !prev)}
                        >
                          {showAllQuestionChips
                            ? "Show fewer question chips"
                            : `Show all ${questionGroup.keywords.length} question chips`}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {(() => {
            const wheelGroups = WHEEL_GROUPS
              .map((type) => allGroups.find((group) => group.type === type))
              .filter((group): group is DiscoveryGroup => Boolean(group && group.keywords.length));

            if (wheelGroups.length === 0) {
              return null;
            }

            return (
              <div className="mb-8 space-y-6">
                {wheelGroups.map((wheelGroup) => (
                  <KeywordWheel
                    key={wheelGroup.type}
                    seed={result.seed}
                    group={wheelGroup}
                    selected={selected}
                    onToggleKeyword={toggleKeyword}
                    onDrilldown={drilldownKeyword}
                  />
                ))}
                <p className="mt-3 text-xs text-slate-500">
                  All discovery circles stay visible by default so users can click through every questions, prepositions, comparisons, and related keyword item.
                </p>
              </div>
            );
          })()}

          {drilldownResult && drilldownPath.length > 0 && (
            <div className="mb-8 space-y-4 border-t-4 border-indigo-300 pt-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-indigo-600 font-semibold">Drill-Down Level {drilldownPath.length}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => { setDrilldownPath([]); setDrilldownResult(null); }}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      {result?.seed}
                    </button>
                    {drilldownPath.map((keyword, idx) => (
                      <div key={`drillpath-${idx}`} className="flex items-center gap-2">
                        <span className="text-slate-400">→</span>
                        <button
                          onClick={() => {
                            const newPath = drilldownPath.slice(0, idx + 1);
                            setDrilldownPath(newPath);
                            if (idx < drilldownPath.length - 1) {
                              drilldownKeyword(keyword);
                            }
                          }}
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          {keyword}
                        </button>
                      </div>
                    ))}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Keywords related to "<span className="text-indigo-600">{drilldownPath[drilldownPath.length - 1]}</span>"</h3>
                  <p className="text-sm text-slate-600 mt-1">Continue drilling down to explore deeper keyword relationships.</p>
                </div>
                <button
                  onClick={backFromDrilldown}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition"
                >
                  ← Back
                </button>
              </div>

              {drilldownLoading ? (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-12 flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border border-indigo-500 border-t-transparent mb-3"></div>
                    <p className="text-slate-600">Loading related keywords...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {drilldownResult.groups
                    .filter((g): g is DiscoveryGroup => g.keywords.length > 0)
                    .map((group) => (
                      <KeywordWheel
                        key={`drilldown-${group.type}`}
                        seed={drilldownPath[drilldownPath.length - 1]}
                        group={group}
                        selected={selected}
                        onToggleKeyword={toggleKeyword}
                        onDrilldown={drilldownKeyword}
                        isDrilldownMode={true}
                      />
                    ))}
                </div>
              )}
            </div>
          )}

          {alphaGroups.length > 0 && (
            <div className="mb-8 rounded-[2rem] border border-emerald-200 bg-[linear-gradient(145deg,#ecfdf5,#f0fdf4)] shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-emerald-100 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-emerald-700 mb-2">A-Z Autocomplete</div>
                  <h3 className="text-xl font-bold text-slate-900">Full A-Z list with drill-down click support</h3>
                  <p className="text-sm text-slate-600 mt-1">Every letter is rendered so users can click keywords directly into selection.</p>
                </div>
                <Badge variant="green">{groupTotals.alphabetical} keywords</Badge>
              </div>
              <div className="p-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {alphaGroups.map((group) => (
                  <div key={`alpha-${group.letter}`} className="rounded-xl border border-white/80 bg-white/90 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-black">
                        {group.letter}
                      </span>
                      <span className="text-xs text-slate-500">{group.keywords.length} terms</span>
                    </div>
                    <div className="max-h-44 overflow-auto space-y-1.5 pr-1">
                      {group.keywords.map((item) => (
                        <button
                          key={`${group.letter}-${item.keyword}`}
                          type="button"
                          onClick={() => toggleKeyword(item.keyword)}
                          className={cn(
                            "w-full text-left text-xs rounded-lg border px-2.5 py-1.5 transition",
                            selected.has(item.keyword)
                              ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                              : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
                          )}
                        >
                          {item.keyword}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSocialPlatform ? (
            <div className="bg-white rounded-[1.6rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-none">
                    <span className="lowercase">{result.seed}</span>
                    <span className="text-slate-500 text-2xl font-semibold ml-2">{socialRows.length} Results</span>
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <button
                      type="button"
                      className="hover:text-orange-600 transition"
                      onClick={() => {
                        const header = `${socialModeTab === "hashtags" ? "Hashtag" : "People"},Posts,Search Vol,CPC\n`;
                        const lines = socialRows.map((row) =>
                          [
                            `"${row.hashtag.replace(/"/g, '""')}"`,
                            row.posts,
                            row.searchVol,
                            row.cpc != null ? row.cpc.toFixed(2) : "",
                          ].join(",")
                        );
                        const blob = new Blob([header + lines.join("\n")], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${result.seed.replace(/\s+/g, "-")}-${socialModeTab}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Download CSV
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      className="hover:text-orange-600 transition"
                      onClick={openAddModal}
                    >
                      Move to Project
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      className="hover:text-orange-600 transition"
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          navigator.clipboard.writeText(window.location.href);
                          setSuccessMsg("Share link copied");
                          setTimeout(() => setSuccessMsg(""), 2000);
                        }
                      }}
                    >
                      Share
                    </button>
                  </div>
                </div>

                <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setSocialModeTab("hashtags")}
                    className={cn(
                      "px-5 py-2 text-xs font-black tracking-[0.14em] uppercase transition",
                      socialModeTab === "hashtags"
                        ? "bg-orange-500 text-white"
                        : "bg-white text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    Hashtags
                  </button>
                  <button
                    type="button"
                    onClick={() => setSocialModeTab("people")}
                    className={cn(
                      "px-5 py-2 text-xs font-black tracking-[0.14em] uppercase transition border-l border-slate-200",
                      socialModeTab === "people"
                        ? "bg-orange-500 text-white"
                        : "bg-white text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    People
                  </button>
                </div>
              </div>

              <div className="px-6 py-5 border-b border-slate-100 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-5">
                  <div className="text-xs text-slate-500 font-semibold mb-1">Search Volume</div>
                  <div className="text-4xl font-black text-slate-900 mb-3 tabular-nums">{formatNumber(socialAverageVolume || 0)}</div>
                  <div className="grid grid-cols-3 gap-3 text-[11px] text-slate-500">
                    <div><span className="inline-block w-2 h-2 bg-red-300 mr-1.5" />Low<br />0 - 1,600</div>
                    <div><span className="inline-block w-2 h-2 bg-amber-300 mr-1.5" />Medium<br />1,601 - 3,600</div>
                    <div><span className="inline-block w-2 h-2 bg-emerald-300 mr-1.5" />Good<br />3,601+</div>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-5">
                  <div className="text-xs text-slate-500 font-semibold mb-1">Cost Per Click (CPC)</div>
                  <div className="text-4xl font-black text-slate-900 mb-3 tabular-nums">${socialAverageCpc.toFixed(2)}</div>
                  <div className="grid grid-cols-3 gap-3 text-[11px] text-slate-500">
                    <div><span className="inline-block w-2 h-2 bg-emerald-400 mr-1.5" />Cheap<br />0 - $6.54</div>
                    <div><span className="inline-block w-2 h-2 bg-amber-400 mr-1.5" />Medium<br />$6.55 - $14.72</div>
                    <div><span className="inline-block w-2 h-2 bg-red-300 mr-1.5" />Expensive<br />$14.73+</div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-b border-slate-100 flex gap-3 flex-wrap">
                <select
                  value={socialCpcBand}
                  onChange={(e) => setSocialCpcBand(e.target.value as "all" | "cheap" | "medium" | "expensive")}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="all">CPC: All</option>
                  <option value="cheap">CPC: Cheap</option>
                  <option value="medium">CPC: Medium</option>
                  <option value="expensive">CPC: Expensive</option>
                </select>
                <select
                  value={socialVolumeBand}
                  onChange={(e) => setSocialVolumeBand(e.target.value as "all" | "low" | "medium" | "good")}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="all">Search Vol: All</option>
                  <option value="low">Search Vol: Low</option>
                  <option value="medium">Search Vol: Medium</option>
                  <option value="good">Search Vol: Good</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">{socialModeTab === "hashtags" ? "Hashtags" : "People"}</th>
                      <th className="px-6 py-3 text-right font-semibold">Posts</th>
                      <th className="px-6 py-3 text-right font-semibold">Search Vol</th>
                      <th className="px-6 py-3 text-right font-semibold">CPC</th>
                      <th className="px-6 py-3 text-center font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {socialVisibleRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400">
                          No rows match the selected social filters.
                        </td>
                      </tr>
                    ) : socialVisibleRows.map((row) => {
                      const cpcValue = row.cpc ?? 0;
                      const cpcColor = cpcValue <= 6.54 ? "bg-emerald-300" : cpcValue <= 14.72 ? "bg-amber-300" : "bg-red-300";
                      const volColor = row.searchVol <= 1600 ? "bg-red-300" : row.searchVol <= 3600 ? "bg-amber-300" : "bg-emerald-300";
                      return (
                        <tr key={`${socialModeTab}-${row.hashtag}`} className="border-b border-slate-100 hover:bg-orange-50/25">
                          <td className="px-6 py-3.5 font-semibold text-slate-800">{row.hashtag}</td>
                          <td className="px-6 py-3.5 text-right text-slate-700 tabular-nums">{formatCompactNumber(row.posts)}</td>
                          <td className="px-6 py-3.5 text-right text-slate-700 tabular-nums">
                            <span className="inline-flex items-center gap-1.5"><span className={cn("inline-block w-2 h-2", volColor)} />{formatCompactNumber(row.searchVol)}</span>
                          </td>
                          <td className="px-6 py-3.5 text-right text-slate-700 tabular-nums">
                            <span className="inline-flex items-center gap-1.5"><span className={cn("inline-block w-2 h-2", cpcColor)} />${cpcValue.toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const keyword = row.keyword;
                                setActiveKeyword(keyword);
                                setSelected((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(keyword)) next.delete(keyword);
                                  else next.add(keyword);
                                  return next;
                                });
                              }}
                              className="inline-flex w-6 h-6 items-center justify-center rounded-full border border-slate-300 text-slate-400 hover:text-orange-600 hover:border-orange-300 transition"
                              title="Select"
                            >
                              −
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {socialRows.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Showing {socialVisibleRows.length} of {socialRows.length}</span>
                  {socialRows.length > socialVisibleRows.length && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setVisibleTableRows((prev) => prev + TABLE_ROWS_STEP)}
                    >
                      Load more
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_364px] items-start">
            {/* Left: keyword ideas table */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {filteredMasterRows.length.toLocaleString()} Keyword Ideas
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">for &quot;{result.seed}&quot;</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      placeholder="Filter keywords..."
                      value={tableQuery}
                      onChange={(e) => setTableQuery(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-44"
                    />
                    <input
                      type="text"
                      placeholder="Exclude terms..."
                      value={outputExcludeTerms}
                      onChange={(e) => setOutputExcludeTerms(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-44"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setActiveGroup(null)}
                    className={cn(
                      "px-3 py-1 rounded-full border text-xs font-semibold transition",
                      activeGroup === null
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    )}
                  >
                    All ({masterRows.length})
                  </button>
                  {MASTER_SOURCE_ORDER.map((type) => {
                    const total = groupTotals[type];
                    if (!total) return null;
                    const cfg = GROUP_CONFIG[type];
                    return (
                      <button
                        key={type}
                        onClick={() => setActiveGroup(type)}
                        className={cn(
                          "px-3 py-1 rounded-full border text-xs font-semibold transition",
                          activeGroup === type ? cfg.color : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        )}
                      >
                        {type === "alphabetical" ? "A-Z" : type.charAt(0).toUpperCase() + type.slice(1)} ({total})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 w-8"></th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider">Keyword</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">Vol</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">CPC</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider">KD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMasterRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                          No keywords match the current filters.
                        </td>
                      </tr>
                    ) : displayedMasterRows.map((row) => {
                      const isActive = row.keyword === (activeKeyword ?? result.seed);
                      const isSeed = row.keyword.toLowerCase() === result.seed.toLowerCase();
                      return (
                        <tr
                          key={row.keyword}
                          onClick={() => setActiveKeyword(row.keyword)}
                          className={cn(
                            "border-b border-slate-100 cursor-pointer transition",
                            isActive
                              ? "bg-orange-50 border-orange-100"
                              : isSeed
                              ? "bg-orange-50/40"
                              : "hover:bg-slate-50/80"
                          )}
                        >
                          <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selected.has(row.keyword)}
                              onChange={() => toggleKeyword(row.keyword)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className={cn("font-medium text-slate-900 text-sm", isActive && "text-orange-700")}>
                                {row.keyword}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelected(new Set([row.keyword]));
                                  openAddModal();
                                }}
                                className="text-slate-300 hover:text-indigo-500 transition flex-shrink-0"
                                title="Add to list"
                              >
                                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                                  <path d="M2 2h12v10l-6-3-6 3V2z" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex gap-1 mt-0.5 flex-wrap">
                              {row.sources.map((source) => (
                                <span key={source} className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium border", GROUP_CONFIG[source].color)}>
                                  {source === "alphabetical" ? "A-Z" : source}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-700 font-medium tabular-nums">
                            {row.volume ? formatNumber(row.volume) : "\u2014"}
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-700 tabular-nums">
                            {row.cpc != null ? `$${row.cpc.toFixed(2)}` : "\u2014"}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {row.difficulty != null ? (
                              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", difficultyColor(row.difficulty))}>
                                {row.difficulty}
                              </span>
                            ) : "\u2014"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredMasterRows.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const header = "Keyword,Volume,CPC,Difficulty,Intent\n";
                        const lines = filteredMasterRows.map((r) =>
                          [
                            `"${r.keyword.replace(/"/g, '""')}"`,
                            r.volume ?? "",
                            r.cpc != null ? r.cpc.toFixed(2) : "",
                            r.difficulty ?? "",
                            r.intent ?? "",
                          ].join(",")
                        );
                        const blob = new Blob([header + lines.join("\n")], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${result.seed.replace(/\s+/g, "-")}-keywords.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Export to CSV
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const text = filteredMasterRows.map((r) => r.keyword).join("\n");
                        navigator.clipboard.writeText(text);
                        setSuccessMsg("Keywords copied to clipboard");
                        setTimeout(() => setSuccessMsg(""), 2000);
                      }}
                    >
                      Copy to Clipboard
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-500">
                      Showing {displayedMasterRows.length} of {filteredMasterRows.length}
                    </p>
                    {canLoadMoreTableRows ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setVisibleTableRows((prev) => prev + TABLE_ROWS_STEP)}
                      >
                        Load more
                      </Button>
                    ) : displayedMasterRows.length > INITIAL_TABLE_ROWS ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setVisibleTableRows(INITIAL_TABLE_ROWS)}
                      >
                        Reset view
                      </Button>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {/* Right: keyword overview */}
            <KeywordOverviewPanel
              keyword={activeKeyword ?? result.seed}
              row={filteredMasterRows.find((r) => r.keyword === (activeKeyword ?? result.seed)) ?? null}
            />
            </div>
          )}

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="rounded-[2rem] border border-teal-200 bg-[linear-gradient(145deg,#f0fdfa,#ecfeff)] shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-teal-100">
                <div className="text-xs uppercase tracking-[0.18em] text-teal-700 mb-2">Local Searches</div>
                <h3 className="text-xl font-bold text-slate-900">Geo-specific keyword exploration</h3>
                <p className="text-sm text-slate-600 mt-1">Filter by state and major DMA to target local search demand.</p>
              </div>
              <div className="px-6 py-4 grid gap-3 sm:grid-cols-2 border-b border-teal-100">
                <div>
                  <label className="text-xs uppercase tracking-[0.14em] text-slate-500 block mb-1">State</label>
                  <select
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {STATE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.14em] text-slate-500 block mb-1">DMA</label>
                  <select
                    value={dmaFilter}
                    onChange={(e) => setDmaFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {DMA_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 max-h-[360px] overflow-auto space-y-2">
                {filteredLocalIdeas.length === 0 ? (
                  <div className="text-sm text-slate-500">No local ideas match the current filters.</div>
                ) : filteredLocalIdeas.slice(0, 200).map((idea) => (
                  <button
                    key={`${idea.keyword}-${idea.marketHint}`}
                    onClick={() => toggleKeyword(idea.keyword)}
                    className="w-full text-left rounded-xl border border-white/70 bg-white/80 px-4 py-3 hover:border-teal-300 transition"
                  >
                    <div className="font-semibold text-slate-900">{idea.keyword}</div>
                    <div className="mt-1 text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                      <Badge variant="green">{idea.state}</Badge>
                      <Badge variant="blue">{idea.dma}</Badge>
                      <span>{idea.volume ? `${formatNumber(idea.volume)} est. volume` : "geo opportunity"}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div id="content-ideas" className="rounded-[2rem] border border-amber-200 bg-[linear-gradient(145deg,#fffbeb,#fff7ed)] shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-amber-100">
                <div className="text-xs uppercase tracking-[0.18em] text-amber-700 mb-2">Content Ideas</div>
                <h3 className="text-xl font-bold text-slate-900">Publish-ready SEO content opportunities</h3>
                <p className="text-sm text-slate-600 mt-1">Idea briefs generated from your discovery graph and keyword table.</p>
              </div>
              <div className="p-6 grid gap-3">
                {contentIdeas.length === 0 ? (
                  <div className="text-sm text-slate-500">Run discovery to generate content ideas.</div>
                ) : contentIdeas.map((idea) => (
                  <div key={`${idea.targetKeyword}-${idea.title}`} className="rounded-xl border border-white/70 bg-white/80 p-4">
                    <div className="text-base font-semibold text-slate-900">{idea.title}</div>
                    <div className="text-sm text-slate-600 mt-1">{idea.angle}</div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Badge variant="orange">{idea.targetKeyword}</Badge>
                      <Button size="sm" variant="ghost" onClick={() => toggleKeyword(idea.targetKeyword)}>
                        Add keyword
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div id="historical-performance" className="mt-8">
            <div className="mb-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">Historical Performance</div>
              <h3 className="text-2xl font-bold text-slate-900">Volume trend, desktop vs mobile, and intent signals</h3>
              <p className="text-sm text-slate-600 mt-1">Analyze historical movement and device split directly inside discovery.</p>
            </div>
            <OverviewWithVolume />
          </div>
        </>
      )}

      {/* Add to list modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">
              Add {selected.size} keyword{selected.size > 1 ? "s" : ""} to list
            </h3>
            {lists.length === 0 ? (
              <p className="text-slate-500 text-sm mb-4">You do not have any lists yet.</p>
            ) : (
              <div className="flex flex-col gap-2 mb-4 max-h-64 overflow-y-auto">
                {lists.map((list) => (
                  <button
                    key={list.id}
                    disabled={addingToList}
                    onClick={() => addToList(list.id)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50 transition text-left"
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: list.color || "#6366f1" }}
                    />
                    <span className="text-sm font-medium text-slate-700">{list.name}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setShowAddModal(false);
                  // Navigate to create list page
                  window.location.href = "/dashboard/lists";
                }}
              >
                + New list
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
