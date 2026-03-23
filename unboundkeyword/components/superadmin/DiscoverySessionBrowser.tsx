"use client";

import { useState, useMemo } from "react";
import type { DiscoverySession, DiscoveryKeyword } from "@prisma/client";

interface DiscoverySessionWithKeywords extends DiscoverySession {
  keywords: DiscoveryKeyword[];
}

interface Props {
  sessions: DiscoverySessionWithKeywords[];
  totalKeywords: number;
}

export default function DiscoverySessionBrowser({ sessions, totalKeywords }: Props) {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [filterGroup, setFilterGroup] = useState<string>("all");

  const selectedData = sessions.find((s) => s.id === selectedSession);
  const filteredKeywords = useMemo(() => {
    if (!selectedData) return [];
    if (filterGroup === "all") return selectedData.keywords;
    return selectedData.keywords.filter((k) => k.groupType === filterGroup);
  }, [selectedData, filterGroup]);

  // Statistics
  const stats = useMemo(() => {
    if (!selectedData) {
      return { questions: 0, prepositions: 0, comparisons: 0, related: 0, alphabetical: 0, total: 0, avgVolume: 0 };
    }

    const groups = {
      questions: selectedData.keywords.filter((k) => k.groupType === "questions").length,
      prepositions: selectedData.keywords.filter((k) => k.groupType === "prepositions").length,
      comparisons: selectedData.keywords.filter((k) => k.groupType === "comparisons").length,
      related: selectedData.keywords.filter((k) => k.groupType === "related").length,
      alphabetical: selectedData.keywords.filter((k) => k.groupType === "alphabetical").length,
    };

    const totalVol = selectedData.keywords.reduce((sum, k) => sum + (k.volume ?? 0), 0);
    const avgVol = selectedData.keywords.length > 0 ? Math.round(totalVol / selectedData.keywords.length) : 0;

    return {
      ...groups,
      total: selectedData.keywords.length,
      avgVolume: avgVol,
    };
  }, [selectedData]);

  return (
    <div className="space-y-6">
      {/* Session Browser */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Sessions List */}
        <div className="lg:col-span-1 bg-white rounded-lg border border-slate-200 p-4 max-h-96 overflow-y-auto">
          <h3 className="font-semibold text-sm text-slate-900 mb-3">Discovery Sessions ({sessions.length})</h3>
          <div className="space-y-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setSelectedSession(session.id)}
                className={`w-full text-left p-3 rounded border text-sm transition ${
                  selectedSession === session.id
                    ? "bg-blue-50 border-blue-300"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="font-medium text-slate-900">{session.seedKeyword}</div>
                <div className="text-xs text-slate-600 mt-1">
                  {session.keywords.length} keywords · {new Date(session.createdAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Session Details */}
        <div className="lg:col-span-2">
          {selectedData ? (
            <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
              {/* Header */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900">"{selectedData.seedKeyword}"</h2>
                <p className="text-sm text-slate-600 mt-1">
                  {selectedData.location} • {selectedData.language.toUpperCase()}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Created {new Date(selectedData.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-xs text-blue-700 mt-1">Total Keywords</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded p-3">
                  <div className="text-2xl font-bold text-purple-600">{stats.avgVolume}</div>
                  <div className="text-xs text-purple-700 mt-1">Avg Volume</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <div className="text-2xl font-bold text-green-600">{selectedData.keywords.reduce((s, k) => s + (k.volume ?? 0), 0).toLocaleString()}</div>
                  <div className="text-xs text-green-700 mt-1">Total Volume</div>
                </div>
              </div>

              {/* Group Breakdown */}
              <div>
                <h4 className="font-semibold text-sm text-slate-900 mb-3">Breakdown by Type</h4>
                <div className="space-y-2">
                  {[
                    { label: "Questions", value: stats.questions, color: "bg-blue-100 text-blue-800" },
                    { label: "Prepositions", value: stats.prepositions, color: "bg-purple-100 text-purple-800" },
                    { label: "Comparisons", value: stats.comparisons, color: "bg-orange-100 text-orange-800" },
                    { label: "Related", value: stats.related, color: "bg-slate-100 text-slate-800" },
                    { label: "A-Z Terms", value: stats.alphabetical, color: "bg-green-100 text-green-800" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{item.label}</span>
                      <span className={`px-3 py-1 rounded text-xs font-semibold ${item.color}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filter Buttons */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Filter by Type</label>
                <div className="flex flex-wrap gap-2">
                  {["all", "questions", "prepositions", "comparisons", "related", "alphabetical"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterGroup(type)}
                      className={`px-3 py-1 rounded text-xs font-medium transition ${
                        filterGroup === type
                          ? "bg-blue-500 text-white"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-lg border border-dashed border-slate-300 p-8 text-center">
              <p className="text-sm text-slate-600">Select a session to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Keywords Table */}
      {selectedData && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="font-semibold text-sm text-slate-900 mb-4">
            Keywords ({filteredKeywords.length})
          </h3>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-2 text-slate-700 font-semibold">Keyword</th>
                  <th className="text-right p-2 text-slate-700 font-semibold">Volume</th>
                  <th className="text-right p-2 text-slate-700 font-semibold">Difficulty</th>
                  <th className="text-right p-2 text-slate-700 font-semibold">CPC</th>
                  <th className="text-center p-2 text-slate-700 font-semibold">Intent</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeywords.slice(0, 50).map((keyword) => (
                  <tr key={keyword.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-2">{keyword.keyword}</td>
                    <td className="text-right p-2 text-slate-600">{keyword.volume?.toLocaleString() ?? "—"}</td>
                    <td className="text-right p-2 text-slate-600">{keyword.difficulty ?? "—"}</td>
                    <td className="text-right p-2 text-slate-600">${keyword.cpc?.toFixed(2) ?? "—"}</td>
                    <td className="text-center p-2">
                      <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">
                        {keyword.intent ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
