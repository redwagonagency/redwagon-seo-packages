"use client";

import { useState, useEffect } from "react";
import VolumeGraph from "./VolumeGraph";

interface StateData {
  state: string;
  volume: number;
  difficulty: number | null;
  cpc: number | null;
  searchCount?: number;
}

interface KeywordDetails {
  keyword: string;
  platform: string;
  currentVolume: number;
  currentDesktopVolume: number;
  currentMobileVolume: number;
  ageRangeData?: Record<string, number>;
  intent?: string | null;
  stateData?: StateData[];
}

interface RelatedTerm {
  keyword: string;
  volume: number;
  intent: string;
}

interface IntentSignal {
  intent: string;
  count: number;
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export default function OverviewWithVolume() {
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordDetails | null>(null);
  const [volumeHistory, setVolumeHistory] = useState<any[]>([]);
  const [stateData, setStateData] = useState<StateData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStates, setSelectedStates] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"volume" | "difficulty" | "cpc">("volume");
  const [relatedTerms, setRelatedTerms] = useState<RelatedTerm[]>([]);
  const [intentSignals, setIntentSignals] = useState<IntentSignal[]>([]);

  const handleKeywordSelect = async (keyword: string) => {
    setLoading(true);
    setSelectedStates(new Set());
    try {
      // Fetch keyword details, historical data, and state breakdown
      const response = await fetch(`/api/keyword-volume?keyword=${encodeURIComponent(keyword)}`);
      const data = await response.json();
      
      if (data.keyword) {
        setSelectedKeyword(data.keyword);
        setVolumeHistory(data.history || []);
        setStateData(data.keyword.stateData || []);
        setRelatedTerms(data.relatedTerms || []);
        setIntentSignals(data.intentDistribution || []);
      }
    } catch (error) {
      console.error("Failed to fetch keyword details:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStateSelection = (state: string) => {
    const newSelection = new Set(selectedStates);
    if (newSelection.has(state)) {
      newSelection.delete(state);
    } else {
      newSelection.add(state);
    }
    setSelectedStates(newSelection);
  };

  const sortedStateData = [...stateData].sort((a, b) => {
    if (sortBy === "volume") return (b.volume || 0) - (a.volume || 0);
    if (sortBy === "difficulty") return (b.difficulty || 0) - (a.difficulty || 0);
    if (sortBy === "cpc") return (b.cpc || 0) - (a.cpc || 0);
    return 0;
  });

  return (
    <div className="space-y-8">
      {/* Search for Keyword */}
      <div className="bg-white rounded-lg border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Keyword Deep Dive</h2>
        <p className="text-sm text-slate-600 mb-4">Select a keyword from your discovery sessions to see volume trends and demographics</p>
        
        <input
          type="text"
          placeholder="Type to search keywords..."
          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f15b27] text-sm text-slate-900 placeholder:text-slate-500"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.currentTarget.value) {
              handleKeywordSelect(e.currentTarget.value);
              e.currentTarget.value = "";
            }
          }}
        />
      </div>

      {/* Volume Graph */}
      {selectedKeyword && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedKeyword.keyword}</h3>
                <p className="text-sm text-slate-600">{selectedKeyword.platform}</p>
              </div>
              <button
                onClick={() => setSelectedKeyword(null)}
                className="px-3 py-1 text-sm text-slate-600 hover:text-slate-900 font-medium"
              >
                ✕ Clear
              </button>
            </div>

            {/* Current Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-slate-100">
              <div>
                <p className="text-xs text-slate-600 mb-1">Total Volume</p>
                <p className="text-2xl font-bold text-slate-900">
                  {selectedKeyword.currentVolume.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Desktop</p>
                <p className="text-2xl font-bold text-blue-700">
                  {selectedKeyword.currentDesktopVolume.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Mobile</p>
                <p className="text-2xl font-bold text-orange-700">
                  {selectedKeyword.currentMobileVolume.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Volume Graph */}
          {volumeHistory.length > 0 && (
            <VolumeGraph
              keyword={selectedKeyword.keyword}
              data={volumeHistory}
              platform={selectedKeyword.platform}
            />
          )}

          {/* Demographic Data */}
          <div className="bg-white rounded-lg border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Age Range Distribution</h3>
            <div className="grid grid-cols-5 gap-3">
              {[
                { range: "18-24", color: "bg-blue-100", textColor: "text-blue-900" },
                { range: "25-34", color: "bg-green-100", textColor: "text-green-900" },
                { range: "35-44", color: "bg-yellow-100", textColor: "text-yellow-900" },
                { range: "45-54", color: "bg-orange-100", textColor: "text-orange-900" },
                { range: "55+", color: "bg-red-100", textColor: "text-red-900" },
              ].map((group) => (
                <div key={group.range} className={`${group.color} rounded-lg p-4 text-center`}>
                  <p className={`text-sm font-semibold ${group.textColor}`}>{group.range}</p>
                  <p className="text-2xl font-bold mt-1">{selectedKeyword.ageRangeData?.[group.range] ?? 0}%</p>
                  <p className={`text-xs ${group.textColor} mt-1`}>search share</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Intent Signals</h3>
              {intentSignals.length === 0 ? (
                <p className="text-sm text-slate-500">No intent signals yet for this seed.</p>
              ) : (
                <div className="space-y-2">
                  {intentSignals.map((signal) => (
                    <div key={signal.intent} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <span className="text-sm font-medium text-slate-800 capitalize">{signal.intent}</span>
                      <span className="text-sm font-bold text-slate-900">{signal.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Related Terms</h3>
              {relatedTerms.length === 0 ? (
                <p className="text-sm text-slate-500">No related terms found yet.</p>
              ) : (
                <div className="max-h-72 overflow-auto space-y-2 pr-1">
                  {relatedTerms.map((term) => (
                    <button
                      key={term.keyword}
                      onClick={() => handleKeywordSelect(term.keyword)}
                      className="w-full text-left rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-[#f15b27] hover:bg-orange-50/30 transition"
                    >
                      <div className="text-sm font-semibold text-slate-900">{term.keyword}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {term.volume.toLocaleString()} volume · {term.intent}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* State-Level Data */}
          {stateData.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">State Breakdown</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortBy("volume")}
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      sortBy === "volume"
                        ? "bg-[#f15b27] text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Sort by Volume
                  </button>
                  <button
                    onClick={() => setSortBy("difficulty")}
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      sortBy === "difficulty"
                        ? "bg-[#f15b27] text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Sort by KD
                  </button>
                  <button
                    onClick={() => setSortBy("cpc")}
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      sortBy === "cpc"
                        ? "bg-[#f15b27] text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Sort by CPC
                  </button>
                </div>
              </div>

              {/* Selected states count */}
              {selectedStates.size > 0 && (
                <div className="mb-4 pb-4 border-b border-slate-200">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">{selectedStates.size}</span> state(s) selected
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.from(selectedStates).map((state) => (
                      <button
                        key={state}
                        onClick={() => toggleStateSelection(state)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#f15b27] text-white text-xs font-medium hover:bg-[#d94e1f] transition"
                      >
                        {state}
                        <span>✕</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* State data table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">State</th>
                      <th className="px-4 py-2 text-right font-semibold text-slate-700">Volume</th>
                      <th className="px-4 py-2 text-right font-semibold text-slate-700">KD</th>
                      <th className="px-4 py-2 text-right font-semibold text-slate-700">CPC</th>
                      <th className="px-4 py-2 text-center font-semibold text-slate-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedStateData.map((state, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-900">{state.state}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-900 font-medium">
                          {(state.volume || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {state.difficulty !== null ? (
                            <span
                              className="text-xs font-semibold px-2 py-1 rounded"
                              style={{
                                background:
                                  state.difficulty > 70
                                    ? "#fee2e2"
                                    : state.difficulty > 40
                                    ? "#fef3c7"
                                    : "#dcfce7",
                                color:
                                  state.difficulty > 70
                                    ? "#991b1b"
                                    : state.difficulty > 40
                                    ? "#9a3412"
                                    : "#15803d",
                              }}
                            >
                              {state.difficulty}
                            </span>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-900">
                          {state.cpc ? `$${state.cpc.toFixed(2)}` : <span className="text-slate-400">--</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleStateSelection(state.state)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${
                              selectedStates.has(state.state)
                                ? "bg-[#f15b27] text-white hover:bg-[#d94e1f]"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            {selectedStates.has(state.state) ? "✓" : "+"} Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Create list from selected states */}
              {selectedStates.size > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-200 flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    Create a keyword list for your {selectedStates.size} selected state(s)?
                  </p>
                  <button className="px-4 py-2 rounded-lg bg-[#f15b27] text-white font-medium hover:bg-[#d94e1f] transition text-sm">
                    Create List →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!selectedKeyword && !loading && (
        <div className="bg-slate-50 rounded-lg border border-slate-100 p-12 text-center">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-slate-600 font-medium">Search for a keyword to see detailed insights</p>
        </div>
      )}
    </div>
  );
}
