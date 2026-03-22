"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/utils";
import SaveToListModal, { type KWToSave } from "@/components/dashboard/SaveToListModal";

interface ProductListing {
  position: number | null;
  title: string | null;
  price: string | null;
  seller: string | null;
  rating: number | null;
  reviews: number | null;
  url: string | null;
  imageUrl: string | null;
}

interface ProductKeywordResult {
  keyword: string;
  productCount: number;
  avgPrice: string | null;
  products: ProductListing[];
}

export default function ProductKeywordsPage() {
  const [query, setQuery] = useState("laptop");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<ProductKeywordResult[]>([]);
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  async function runSearch(nextQuery?: string) {
    const keyword = (nextQuery ?? query).trim();
    if (!keyword) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/product-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, location: 2840 }),
      });
      const data = (await res.json()) as {
        error?: string;
        results?: ProductKeywordResult[];
      };
      if (!res.ok) throw new Error(data.error || "Search failed");

      setResults(data.results ?? []);
      setSelected(new Set());
      setQuery(keyword);
      setExpandedKeyword((data.results ?? [])[0]?.keyword ?? null);
    } catch (e) {
      setResults([]);
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void runSearch(); }, []);

  const totalProducts = results.reduce((sum, r) => sum + r.productCount, 0);
  const expanded = results.find((r) => r.keyword === expandedKeyword);
  const allChecked = results.length > 0 && selected.size === results.length;

  function toggleRow(keyword: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(keyword)) next.delete(keyword);
      else next.add(keyword);
      return next;
    });
  }

  function toggleAll() {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(results.map((r) => r.keyword)));
  }

  const selectedKws: KWToSave[] = results
    .filter((r) => selected.has(r.keyword))
    .map((r) => ({ keyword: r.keyword }));

  return (
    <div className="p-8 max-w-7xl">
      <div className="rounded-xl border border-[#f15b27] bg-[#fff3ee] p-2 flex gap-2 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="product keyword"
          className="flex-1 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-500"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void runSearch();
            }
          }}
        />
        <button
          type="button"
          onClick={() => void runSearch()}
          disabled={loading || !query.trim()}
          className="rounded-md bg-[#f15b27] px-4 py-2 text-xs font-black text-white disabled:opacity-60"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Keywords list */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleAll}
                className="rounded border-slate-300 text-[#f15b27] focus:ring-[#f15b27]"
              />
              <p className="text-sm font-semibold text-slate-500">Product Keyword Variants</p>
            </div>
            <div className="flex items-center gap-2">
              {selected.size > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSaveModal(true)}
                  className="rounded-md bg-[#f15b27] px-4 py-1.5 text-xs font-black text-white hover:bg-[#d94e1f] transition"
                >
                  + Save {selected.size} to List
                </button>
              )}
              {savedMsg && <span className="text-xs text-emerald-600 font-semibold">{savedMsg}</span>}
              <span className="text-xs font-semibold text-slate-500">{results.length} found</span>
            </div>
          </div>
          <div className="space-y-0 max-h-[550px] overflow-y-auto divide-y divide-slate-100">
            {results.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-slate-400">Search to discover product keywords and shopping results.</div>
            ) : (
              results.map((result) => (
                <div key={result.keyword} className="flex items-center gap-3 px-4 py-1 hover:bg-slate-50 transition">
                  <input
                    type="checkbox"
                    checked={selected.has(result.keyword)}
                    onChange={() => toggleRow(result.keyword)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0 rounded border-slate-300 text-[#f15b27] focus:ring-[#f15b27]"
                  />
                  <button
                    onClick={() => setExpandedKeyword(result.keyword)}
                    className={`flex-1 text-left py-2 transition-colors ${
                      expandedKeyword === result.keyword ? "text-[#f15b27]" : "text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{result.keyword}</p>
                        <p className="text-xs text-slate-500">{result.productCount} products · {result.avgPrice || "—"}</p>
                      </div>
                      <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Products detail */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden h-fit sticky top-8">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900">{expanded?.keyword || "Select a keyword"}</h2>
            <p className="text-xs text-slate-500 mt-1">{expanded?.productCount ?? 0} products</p>
          </div>
          <div className="max-h-[600px] overflow-y-auto space-y-3 p-4">
            {expanded?.products.slice(0, 8).map((product, idx) => (
              <div key={`${expanded.keyword}-${idx}`} className="pb-3 border-b border-slate-100 last:border-0">
                <p className="text-xs font-semibold text-slate-500">#{(product.position ?? idx) + 1}</p>
                <p className="text-sm font-medium text-slate-800 line-clamp-2 mt-0.5">{product.title || "Untitled"}</p>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-sm font-bold text-[#f15b27]">{product.price || "—"}</span>
                  {product.rating ? (
                    <span className="text-xs text-slate-500">⭐ {product.rating.toFixed(1)}</span>
                  ) : null}
                </div>
                {product.seller ? <p className="text-xs text-slate-500 mt-1">{product.seller}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      {totalProducts > 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-600">
            <span className="font-semibold">{totalProducts.toLocaleString()}</span> total products found across{" "}
            <span className="font-semibold">{results.length}</span> keyword variants. Click any keyword to see live Google Shopping results.
          </p>
        </div>
      )}

      {showSaveModal && (
        <SaveToListModal
          keywords={selectedKws}
          onClose={() => setShowSaveModal(false)}
          onSaved={(count) => {
            setSavedMsg(`✓ ${count} keyword${count !== 1 ? "s" : ""} saved`);
            setSelected(new Set());
            setTimeout(() => setSavedMsg(""), 4000);
          }}
        />
      )}
    </div>
  );
}
