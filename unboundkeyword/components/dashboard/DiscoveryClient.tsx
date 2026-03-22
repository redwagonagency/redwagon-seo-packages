"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
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
}

interface MasterKeywordRow extends DiscoveryKeyword {
  primaryGroup: DiscoveryGroup["type"];
  sources: DiscoveryGroup["type"][];
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

const MASTER_SOURCE_ORDER: DiscoveryGroup["type"][] = [
  "questions",
  "prepositions",
  "comparisons",
  "alphabetical",
  "related",
];

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

function KeywordWheel({
  seed,
  group,
  selected,
  onToggleKeyword,
}: {
  seed: string;
  group: DiscoveryGroup;
  selected: Set<string>;
  onToggleKeyword: (keyword: string) => void;
}) {
  const cfg = GROUP_CONFIG[group.type];
  const items = group.keywords.slice(0, 24);
  const centerX = 340;
  const centerY = 340;
  const innerRadius = 74;
  const outerRadius = 242;
  const labelRadius = 274;

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{group.label} Wheel</h2>
          <p className="text-sm text-slate-500">AnswerThePublic-style circular view for {group.label.toLowerCase()} keywords.</p>
        </div>
        <Badge variant={cfg.badge}>{items.length} visible</Badge>
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

          {items.map((keyword, index) => {
            const angle = (-90 + (360 / items.length) * index) * (Math.PI / 180);
            const lineX = centerX + outerRadius * Math.cos(angle);
            const lineY = centerY + outerRadius * Math.sin(angle);
            const innerX = centerX + innerRadius * Math.cos(angle);
            const innerY = centerY + innerRadius * Math.sin(angle);
            const labelX = centerX + labelRadius * Math.cos(angle);
            const labelY = centerY + labelRadius * Math.sin(angle);
            const textAnchor = labelX > centerX + 8 ? "start" : labelX < centerX - 8 ? "end" : "middle";
            const isSelected = selected.has(keyword.keyword);

            return (
              <g key={keyword.keyword} onClick={() => onToggleKeyword(keyword.keyword)} className="cursor-pointer">
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
                  {keyword.keyword}
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
          <circle cx={centerX} cy={centerY} r={72} fill="none" stroke="rgb(99 102 241)" strokeWidth={2} opacity={0.35} />
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

export default function DiscoveryClient() {
  const [seed, setSeed] = useState("");
  const [location, setLocation] = useState("2840");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [tableQuery, setTableQuery] = useState("");
  const [lists, setLists] = useState<List[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingToList, setAddingToList] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

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

  async function discover(e: React.FormEvent) {
    e.preventDefault();
    if (!seed.trim()) return;
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
        body: JSON.stringify({ seed: seed.trim(), location: Number(location), language, save: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Discovery failed");
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

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
  const filteredMasterRows = masterRows.filter((row) => {
    const matchesGroup = !activeGroup || row.sources.includes(activeGroup as DiscoveryGroup["type"]);
    const query = tableQuery.trim().toLowerCase();
    const matchesQuery = !query || row.keyword.toLowerCase().includes(query);
    return matchesGroup && matchesQuery;
  });

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
            <div className="rounded-2xl bg-white/8 border border-white/10 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">Circle Graph</div>
              <div className="text-lg font-bold">Questions, modifiers, and related terms in one visual map</div>
            </div>
            <div className="rounded-2xl bg-white/8 border border-white/10 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">Master Table</div>
              <div className="text-lg font-bold">Every keyword source merged into one results surface</div>
            </div>
            <div className="rounded-2xl bg-white/8 border border-white/10 p-4">
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

      {result && (
        <>
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.18em] text-blue-600 mb-2">Questions</div>
              <div className="text-2xl font-black text-slate-900">{groupTotals.questions}</div>
            </div>
            <div className="rounded-2xl border border-purple-200 bg-purple-50 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.18em] text-purple-600 mb-2">Prepositions</div>
              <div className="text-2xl font-black text-slate-900">{groupTotals.prepositions}</div>
            </div>
            <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.18em] text-orange-600 mb-2">Comparisons</div>
              <div className="text-2xl font-black text-slate-900">{groupTotals.comparisons}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Related + A-Z</div>
              <div className="text-2xl font-black text-slate-900">{groupTotals.related + groupTotals.alphabetical}</div>
            </div>
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
            const wheelType = (activeGroup && WHEEL_GROUPS.includes(activeGroup as WheelGroupType)
              ? activeGroup
              : WHEEL_GROUPS.find((type) => allGroups.some((group) => group.type === type))) as WheelGroupType | undefined;
            const wheelGroup = wheelType ? allGroups.find((group) => group.type === wheelType) : undefined;

            if (!wheelGroup) {
              return null;
            }

            return (
              <div className="mb-8">
                <KeywordWheel
                  seed={result.seed}
                  group={wheelGroup}
                  selected={selected}
                  onToggleKeyword={toggleKeyword}
                />
                <p className="mt-3 text-xs text-slate-500">
                  The circle stays visible as the visual layer for discovery. The master table below merges every keyword source into one place.
                </p>
              </div>
            );
          })()}

          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">Master Results</div>
                <h2 className="text-2xl font-bold text-slate-900">One keyword table across every discovery source</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Questions, prepositions, comparisons, A-Z, and related suggestions are merged and deduplicated here.
                </p>
              </div>
              <div className="w-full lg:w-80">
                <Input
                  label="Filter results"
                  placeholder="Search within the master table"
                  value={tableQuery}
                  onChange={(e) => setTableQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveGroup(null)}
                className={cn(
                  "px-3 py-1.5 rounded-full border text-xs font-semibold transition",
                  activeGroup === null
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                )}
              >
                All sources ({masterRows.length})
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
                      "px-3 py-1.5 rounded-full border text-xs font-semibold transition",
                      activeGroup === type ? cfg.color : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    )}
                  >
                    {type === "alphabetical" ? "A-Z" : type.charAt(0).toUpperCase() + type.slice(1)} ({total})
                  </button>
                );
              })}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-500">Select</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-500">Keyword</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-500">Sources</th>
                    <th className="px-6 py-3 text-right font-semibold text-slate-500">Volume</th>
                    <th className="px-6 py-3 text-center font-semibold text-slate-500">KD</th>
                    <th className="px-6 py-3 text-right font-semibold text-slate-500">CPC</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-500">Intent</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMasterRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                        No keywords match the current source filter or table search.
                      </td>
                    </tr>
                  ) : filteredMasterRows.map((row) => (
                    <tr key={row.keyword} className="border-b border-slate-100 hover:bg-slate-50/80">
                      <td className="px-6 py-3 align-top">
                        <input
                          type="checkbox"
                          checked={selected.has(row.keyword)}
                          onChange={() => toggleKeyword(row.keyword)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-6 py-3 align-top">
                        <div className="font-semibold text-slate-900">{row.keyword}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          Primary source: {row.primaryGroup === "alphabetical" ? "A-Z" : row.primaryGroup}
                        </div>
                      </td>
                      <td className="px-6 py-3 align-top">
                        <div className="flex flex-wrap gap-1.5">
                          {row.sources.map((source) => (
                            <Badge key={`${row.keyword}-${source}`} variant={GROUP_CONFIG[source].badge}>
                              {source === "alphabetical" ? "A-Z" : source}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-3 align-top text-right text-slate-700 font-medium">
                        {row.volume ? formatNumber(row.volume) : "-"}
                      </td>
                      <td className="px-6 py-3 align-top text-center">
                        {row.difficulty != null ? (
                          <span className={cn("text-xs font-semibold px-1.5 py-0.5 rounded", difficultyColor(row.difficulty))}>
                            {row.difficulty}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-6 py-3 align-top text-right text-slate-700">
                        {row.cpc != null ? `$${row.cpc.toFixed(2)}` : "-"}
                      </td>
                      <td className="px-6 py-3 align-top">
                        {row.intent ? <Badge variant={intentBadgeVariant(row.intent)}>{row.intent}</Badge> : <span className="text-slate-400">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
