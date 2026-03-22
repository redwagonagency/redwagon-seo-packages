"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/utils";

interface KeywordResult {
  keyword: string;
  searchVolume: number;
  cpc: number | null;
  difficulty: number | null;
  intent: string | null;
}

interface ProductResult {
  keyword: string;
  productCount: number;
  avgPrice: string | null;
  topProduct: {
    title: string | null;
    price: string | null;
    seller: string | null;
    rating: number | null;
  };
}

interface ToolkitResponse {
  query: string;
  keywords: KeywordResult[];
  products: ProductResult[];
  totalResults: {
    keywordIdeas: number;
    productListings: number;
  };
}

export default function SeoToolkitPage() {
  const [query, setQuery] = useState("smartwatch");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<ToolkitResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"keywords" | "products">("keywords");

  async function runSearch(nextQuery?: string) {
    const searchQuery = (nextQuery ?? query).trim();
    if (!searchQuery) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/seo-toolkit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          location: 2840,
          language: "en",
          includeKeywords: true,
          includeProducts: true,
          limit: 50,
        }),
      });
      const result = (await res.json()) as ToolkitResponse | { error?: string };
      if (!res.ok) throw new Error((result as { error?: string }).error || "Search failed");

      setData(result as ToolkitResponse);
      setQuery(searchQuery);
      setActiveTab("keywords");
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-slate-900 mb-2">SEO Toolkit</h1>
        <p className="text-slate-600">Unified keyword research, product discovery, and market intelligence search.</p>
      </div>

      {/* Search Bar */}
      <div className="rounded-xl border border-[#f15b27] bg-[#fff3ee] p-3 flex gap-2 mb-8">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search keywords, products, or topics..."
          className="flex-1 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500"
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
          className="rounded-md bg-[#f15b27] px-6 py-3 text-xs font-black text-white disabled:opacity-60 whitespace-nowrap"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results Summary */}
      {data && (
        <>
          <div className="grid gap-4 mb-6 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
                Keyword Ideas
              </p>
              <p className="text-3xl font-black text-slate-900">{formatNumber(data.totalResults.keywordIdeas)}</p>
              <p className="text-xs text-slate-500 mt-1">Related search terms &amp; variations</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
                Product Listings
              </p>
              <p className="text-3xl font-black text-slate-900">{formatNumber(data.totalResults.productListings)}</p>
              <p className="text-xs text-slate-500 mt-1">Shopping results &amp; merchant data</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 flex gap-2 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("keywords")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "keywords"
                  ? "border-[#f15b27] text-[#f15b27]"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Keyword Ideas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("products")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "products"
                  ? "border-[#f15b27] text-[#f15b27]"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Product Search
            </button>
          </div>

          {/* Keywords Tab */}
          {activeTab === "keywords" && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Keyword
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Search Volume
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        CPC
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Intent
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.keywords.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-400">
                          No keyword ideas found.
                        </td>
                      </tr>
                    ) : (
                      data.keywords.map((kw) => (
                        <tr key={kw.keyword} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-6 py-3 font-medium text-slate-800">{kw.keyword}</td>
                          <td className="px-6 py-3 text-right tabular-nums text-slate-700">
                            {formatNumber(kw.searchVolume)}
                          </td>
                          <td className="px-6 py-3 text-right tabular-nums text-slate-700">
                            {kw.cpc ? `$${kw.cpc.toFixed(2)}` : "—"}
                          </td>
                          <td className="px-6 py-3 text-center">
                            {kw.intent ? (
                              <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 capitalize">
                                {kw.intent}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="space-y-4">
              {data.products.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                  <p className="text-sm text-slate-400">No product results found for this query.</p>
                </div>
              ) : (
                data.products.map((product) => (
                  <div key={product.keyword} className="rounded-2xl border border-slate-200 bg-white p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{product.keyword}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          {product.productCount} products found in shopping results
                        </p>
                      </div>
                      {product.avgPrice && (
                        <div className="text-right">
                          <p className="text-xs text-slate-500 mb-1">Avg. Price</p>
                          <p className="text-2xl font-black text-[#f15b27]">{product.avgPrice}</p>
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
                        Top Product
                      </p>
                      <div className="space-y-2">
                        {product.topProduct.title && (
                          <p className="font-medium text-slate-900 line-clamp-2">{product.topProduct.title}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          {product.topProduct.price && (
                            <span className="font-bold text-[#f15b27]">{product.topProduct.price}</span>
                          )}
                          {product.topProduct.rating && (
                            <span className="text-slate-600">⭐ {product.topProduct.rating.toFixed(1)}</span>
                          )}
                          {product.topProduct.seller && (
                            <span className="text-slate-500">by {product.topProduct.seller}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {!data && !loading && !error && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
          <svg
            className="w-12 h-12 mx-auto text-slate-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-slate-600">Enter a search query above to get started with unified SEO research.</p>
        </div>
      )}
    </div>
  );
}
