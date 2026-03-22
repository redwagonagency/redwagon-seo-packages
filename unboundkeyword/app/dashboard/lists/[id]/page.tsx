"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn, formatNumber, difficultyColor, intentBadgeVariant } from "@/lib/utils";

interface Keyword {
  id: string;
  keyword: string;
  volume?: number;
  difficulty?: number;
  cpc?: number;
  intent?: string;
  source: string;
  notes?: string;
  addedAt: string;
}

interface ListDetail {
  id: string;
  name: string;
  description?: string;
  color: string;
}

export default function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [list, setList] = useState<ListDetail | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addInput, setAddInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");

  async function fetchData() {
    const [listRes, kwRes] = await Promise.all([
      fetch("/api/lists"),
      fetch(`/api/lists/${id}/keywords`),
    ]);
    const listData = await listRes.json();
    const kwData = await kwRes.json();
    const found = (listData.lists || []).find((l: ListDetail) => l.id === id);
    setList(found || null);
    setKeywords(kwData.keywords || []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [id]);

  const toggleKw = useCallback((kwId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(kwId)) next.delete(kwId);
      else next.add(kwId);
      return next;
    });
  }, []);

  async function addKeywords(e: React.FormEvent) {
    e.preventDefault();
    const kws = addInput
      .split(/[\n,]+/)
      .map((k) => k.trim())
      .filter(Boolean)
      .map((k) => ({ keyword: k, source: "manual" }));
    if (kws.length === 0) return;
    setAdding(true);
    await fetch(`/api/lists/${id}/keywords`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: kws }),
    });
    setAdding(false);
    setAddInput("");
    fetchData();
  }

  async function removeSelected() {
    if (selected.size === 0) return;
    const items = keywords.filter((k) => selected.has(k.id));
    for (const kw of items) {
      await fetch(`/api/lists/${id}/keywords?kw=${encodeURIComponent(kw.keyword)}`, {
        method: "DELETE",
      });
    }
    setSelected(new Set());
    fetchData();
  }

  function exportCsv() {
    const rows = [
      ["keyword", "volume", "difficulty", "cpc", "intent", "source"].join(","),
      ...keywords.map((k) =>
        [k.keyword, k.volume ?? "", k.difficulty ?? "", k.cpc ?? "", k.intent ?? "", k.source].join(",")
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${list?.name || "keywords"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = keywords.filter((k) =>
    k.keyword.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-slate-400">Loading…</div>;
  if (!list) return <div className="p-8 text-red-500">List not found</div>;

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/dashboard/lists" className="hover:text-slate-600">My Lists</Link>
        <span>/</span>
        <span className="text-slate-700 font-medium">{list.name}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: list.color }} />
          <h1 className="text-2xl font-bold text-slate-900">{list.name}</h1>
          <span className="text-slate-400 text-sm">({keywords.length} keywords)</span>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <Button variant="danger" size="sm" onClick={removeSelected}>
              Remove {selected.size}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={exportCsv}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Add keywords form */}
      <form onSubmit={addKeywords} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <p className="text-sm font-semibold text-slate-700 mb-2">Add keywords manually</p>
        <div className="flex gap-3">
          <textarea
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={2}
            placeholder="Enter keywords separated by commas or new lines…"
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
          />
          <Button type="submit" disabled={adding || !addInput.trim()} size="sm">
            {adding ? "Adding…" : "Add"}
          </Button>
        </div>
      </form>

      {/* Search */}
      <div className="mb-4 max-w-xs">
        <Input
          placeholder="Filter keywords…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Keywords table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          {keywords.length === 0 ? "No keywords yet — add some above or discover them" : "No results match your filter"}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left w-6">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) setSelected(new Set(filtered.map((k) => k.id)));
                      else setSelected(new Set());
                    }}
                    checked={filtered.length > 0 && filtered.every((k) => selected.has(k.id))}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Keyword</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Volume</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">KD</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">CPC</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Intent</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((kw) => (
                <tr key={kw.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(kw.id)}
                      onChange={() => toggleKw(kw.id)}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-slate-800 font-medium">{kw.keyword}</td>
                  <td className="px-4 py-2.5 text-right text-slate-500">
                    {kw.volume != null ? formatNumber(kw.volume) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {kw.difficulty != null ? (
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded", difficultyColor(kw.difficulty))}>
                        {kw.difficulty}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-500">
                    {kw.cpc != null ? `$${kw.cpc.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {kw.intent ? (
                      <Badge variant={intentBadgeVariant(kw.intent)}>
                        {kw.intent}
                      </Badge>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {kw.source}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
