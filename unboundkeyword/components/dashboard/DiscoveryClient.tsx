"use client";

import { useState, useCallback } from "react";
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

interface DiscoveryResult {
  seed: string;
  groups: DiscoveryGroup[];
  totalKeywords: number;
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

export default function DiscoveryClient() {
  const [seed, setSeed] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
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

  const toggleGroup = useCallback((keywords: DiscoveryKeyword[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const all = keywords.every((k) => next.has(k.keyword));
      keywords.forEach((k) => (all ? next.delete(k.keyword) : next.add(k.keyword)));
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
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: seed.trim(), save: true }),
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
  const displayedGroups = activeGroup
    ? allGroups.filter((g) =>
        g.type === activeGroup || (g.type === "alphabetical" && activeGroup === "alphabetical")
      )
    : allGroups.filter((g) => g.type !== "alphabetical");
  const alphaGroups = allGroups.filter((g) => g.type === "alphabetical");

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Keyword Discovery</h1>
        <p className="text-slate-500 text-sm">
          Enter a seed keyword to discover questions, prepositions, comparisons, A–Z suggestions and related keywords.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={discover} className="flex gap-3 mb-8 max-w-xl">
        <div className="flex-1">
          <Input
            placeholder="e.g. coffee maker, SEO tools, running shoes…"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={loading} size="md">
          {loading ? "Discovering…" : "Discover"}
        </Button>
      </form>

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
          <p>Discovering keywords for "{seed}"…</p>
          <p className="text-sm mt-1 text-slate-300">This may take 5–10 seconds</p>
        </div>
      )}

      {result && (
        <>
          {/* Summary bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">
                <strong className="text-slate-900">{result.totalKeywords}</strong> keywords found for&nbsp;
                <strong className="text-indigo-600">"{result.seed}"</strong>
              </span>
              {selected.size > 0 && (
                <span className="text-sm font-semibold text-indigo-700">
                  {selected.size} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
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
                  {type.charAt(0).toUpperCase() + type.slice(1)} ({total})
                </button>
              );
            })}
          </div>

          {/* A-Z section */}
          {(activeGroup === "alphabetical" || !activeGroup) && alphaGroups.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                A–Z Suggestions
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {alphaGroups.map((g) => (
                  <div key={g.letter} className="bg-white rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-green-700 bg-green-100 rounded px-2 py-0.5">
                        {g.letter}
                      </span>
                      <button
                        className="text-xs text-slate-400 hover:text-indigo-600"
                        onClick={() => toggleGroup(g.keywords)}
                      >
                        select all
                      </button>
                    </div>
                    {g.keywords.map((kw) => (
                      <label key={kw.keyword} className="flex items-center gap-2 py-0.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selected.has(kw.keyword)}
                          onChange={() => toggleKeyword(kw.keyword)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-slate-700 group-hover:text-indigo-700 truncate flex-1">
                          {kw.keyword}
                        </span>
                        {kw.volume ? (
                          <span className="text-xs text-slate-400 shrink-0">{formatNumber(kw.volume)}</span>
                        ) : null}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main groups */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedGroups
              .filter((g) => g.type !== "alphabetical")
              .map((group) => {
                const cfg = GROUP_CONFIG[group.type];
                const allChecked = group.keywords.length > 0 && group.keywords.every((k) => selected.has(k.keyword));
                return (
                  <div key={`${group.type}-${group.label}`} className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className={cn("flex items-center justify-between px-5 py-3 rounded-t-2xl border-b", cfg.color.split(" ").slice(0, 2).join(" "), "border-b")}>
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
                        <span className="font-semibold text-sm">{group.label}</span>
                        <span className="text-xs opacity-70">({group.keywords.length})</span>
                      </div>
                      <button
                        className="text-xs opacity-70 hover:opacity-100"
                        onClick={() => toggleGroup(group.keywords)}
                      >
                        {allChecked ? "deselect all" : "select all"}
                      </button>
                    </div>
                    <div className="p-3 max-h-72 overflow-y-auto">
                      {group.keywords.map((kw) => (
                        <label key={kw.keyword} className="flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 group">
                          <input
                            type="checkbox"
                            checked={selected.has(kw.keyword)}
                            onChange={() => toggleKeyword(kw.keyword)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="flex-1 text-sm text-slate-700 group-hover:text-slate-900">
                            {kw.keyword}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {kw.volume ? (
                              <span className="text-xs text-slate-400">{formatNumber(kw.volume)}</span>
                            ) : null}
                            {kw.difficulty != null ? (
                              <span
                                className={cn(
                                  "text-xs font-semibold px-1.5 py-0.5 rounded",
                                  difficultyColor(kw.difficulty)
                                )}
                              >
                                {kw.difficulty}
                              </span>
                            ) : null}
                            {kw.intent ? (
                              <Badge variant={intentBadgeVariant(kw.intent)}>
                                {kw.intent}
                              </Badge>
                            ) : null}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
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
              <p className="text-slate-500 text-sm mb-4">You don't have any lists yet.</p>
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
