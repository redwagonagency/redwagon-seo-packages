"use client";

import { useState, useEffect } from "react";

interface RankedKeyword {
  keyword: string;
  position: number;
  volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  traffic: number | null;
  trafficCost: number | null;
}

interface SerpFeature {
  keyword: string;
  feature: string;
  url: string;
  position: number;
}

interface BacklinkAnchor {
  anchorText: string;
  frequency: number;
  dofollow: number;
  nofollow: number;
  backlinksCount: number;
}

interface EnhancedSiteAuditReport {
  domain: string;
  domainMetrics: {
    domainRank: number;
    rankedKeywords: number;
    estimatedTraffic: number;
    topRankedKeywords: RankedKeyword[];
    pagesIndexed: number;
    spamScore: number;
    backlinksTotal: number;
    referringDomains: number;
  } | null;
  onPageAudit: {
    pages: Array<{ url: string; score: number; title: string | null }>;
    errorCount: number;
    duplicateTagsCount: number;
    brokenLinksCount: number;
  } | null;
  serpFeatures: SerpFeature[];
  backlinks: BacklinkAnchor[];
}

interface Props {
  domain?: string;
}

export default function EnhancedSiteAuitClient({ domain: defaultDomain }: Props) {
  const [domain, setDomain] = useState(defaultDomain || "");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EnhancedSiteAuditReport | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "keywords" | "features" | "anchors">("overview");

  async function runAudit() {
    if (!domain) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const url = domain.startsWith("http") ? domain : `https://${domain}`;
      const res = await fetch("/api/site-audit-enhanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error((json as { error?: string }).error || "Audit failed");
      setData(json as EnhancedSiteAuditReport);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Audit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-8 max-w-6xl">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5">
        <h1 className="text-3xl font-black text-slate-900">Enhanced Site Audit</h1>
        <p className="text-sm text-slate-600 mt-1">
          Domain strength, ranked keywords, SERP features, backlink anchors, and on-page health
        </p>
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="example.com"
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm"
          onKeyDown={(e) => e.key === "Enter" && runAudit()}
        />
        <button
          onClick={runAudit}
          disabled={loading || !domain}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Run Audit"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">{error}</div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Overview Metrics */}
          {data.domainMetrics && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Domain Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{data.domainMetrics.domainRank}</div>
                  <div className="text-xs text-slate-600 mt-1">Domain Rank (0-100)</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{data.domainMetrics.rankedKeywords}</div>
                  <div className="text-xs text-slate-600 mt-1">Ranked Keywords</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{Math.round(data.domainMetrics.estimatedTraffic)}</div>
                  <div className="text-xs text-slate-600 mt-1">Est. Organic Traffic</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600">{data.domainMetrics.pagesIndexed}</div>
                  <div className="text-xs text-slate-600 mt-1">Pages Indexed</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">{data.domainMetrics.spamScore}</div>
                  <div className="text-xs text-slate-600 mt-1">Spam Score</div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-indigo-600">{data.domainMetrics.backlinksTotal}</div>
                  <div className="text-xs text-slate-600 mt-1">Total Backlinks</div>
                </div>
                <div className="bg-cyan-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-cyan-600">{data.domainMetrics.referringDomains}</div>
                  <div className="text-xs text-slate-600 mt-1">Referring Domains</div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="flex border-b border-slate-200">
              {[
                { id: "overview", label: "Overview" },
                { id: "keywords", label: "Ranked Keywords" },
                { id: "features", label: "SERP Features" },
                { id: "anchors", label: "Backlink Anchors" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === tab.id
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === "overview" && data.onPageAudit && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">On-Page State</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-red-50 p-4 rounded">
                      <div className="text-2xl font-bold text-red-600">{data.onPageAudit.errorCount}</div>
                      <div className="text-xs text-slate-600 mt-1">Critical Issues</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded">
                      <div className="text-2xl font-bold text-yellow-600">{data.onPageAudit.duplicateTagsCount}</div>
                      <div className="text-xs text-slate-600 mt-1">Duplicate Tags</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded">
                      <div className="text-2xl font-bold text-orange-600">{data.onPageAudit.brokenLinksCount}</div>
                      <div className="text-xs text-slate-600 mt-1">Broken Links</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-medium text-slate-900 mb-2">Top Pages</h4>
                    <div className="space-y-2">
                      {data.onPageAudit.pages.slice(0, 5).map((page, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                          <div className="truncate text-slate-700">{page.url}</div>
                          <div className="font-semibold text-slate-900">{page.score}/100</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "keywords" && data.domainMetrics && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Top Ranked Keywords</h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left p-2 text-slate-700 font-semibold">Keyword</th>
                          <th className="text-center p-2 text-slate-700 font-semibold">Pos.</th>
                          <th className="text-right p-2 text-slate-700 font-semibold">Volume</th>
                          <th className="text-right p-2 text-slate-700 font-semibold">Difficulty</th>
                          <th className="text-right p-2 text-slate-700 font-semibold">Traffic</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.domainMetrics.topRankedKeywords.slice(0, 15).map((kw, idx) => (
                          <tr key={idx} className="border-b border-slate-100">
                            <td className="p-2">{kw.keyword}</td>
                            <td className="text-center p-2">#{kw.position}</td>
                            <td className="text-right p-2">{kw.volume?.toLocaleString() ?? "—"}</td>
                            <td className="text-right p-2">{kw.difficulty ?? "—"}</td>
                            <td className="text-right p-2 font-medium">{Math.round(kw.traffic ?? 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "features" && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">SERP Features</h3>
                  {data.serpFeatures.length > 0 ? (
                    <div className="overflow-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left p-2 text-slate-700 font-semibold">Keyword</th>
                            <th className="text-left p-2 text-slate-700 font-semibold">Feature</th>
                            <th className="text-right p-2 text-slate-700 font-semibold">Position</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.serpFeatures.slice(0, 20).map((f, idx) => (
                            <tr key={idx} className="border-b border-slate-100">
                              <td className="p-2">{f.keyword}</td>
                              <td className="p-2">
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                  {f.feature}
                                </span>
                              </td>
                              <td className="text-right p-2">#{f.position}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-slate-600 text-sm">No SERP features found</p>
                  )}
                </div>
              )}

              {activeTab === "anchors" && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Top Backlink Anchors</h3>
                  {data.backlinks.length > 0 ? (
                    <div className="overflow-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left p-2 text-slate-700 font-semibold">Anchor Text</th>
                            <th className="text-right p-2 text-slate-700 font-semibold">Frequency</th>
                            <th className="text-right p-2 text-slate-700 font-semibold">DoFollow</th>
                            <th className="text-right p-2 text-slate-700 font-semibold">NoFollow</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.backlinks.slice(0, 15).map((a, idx) => (
                            <tr key={idx} className="border-b border-slate-100">
                              <td className="p-2 font-medium">{a.anchorText}</td>
                              <td className="text-right p-2">{a.frequency}</td>
                              <td className="text-right p-2 text-green-600">{a.dofollow}</td>
                              <td className="text-right p-2 text-orange-600">{a.nofollow}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-slate-600 text-sm">No backlink anchors found</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
