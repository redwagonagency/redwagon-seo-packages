"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface KeywordClusterProps {
  keywords: any[];
}

// SVG Wheel component for hierarchical visualization
function KeywordWheel({ data, title }: { data: any; title: string }) {
  const entries = Object.entries(data as Record<string, number>);
  const angleSlice = (2 * Math.PI) / entries.length;
  const radius = 150;
  const centerX = 200;
  const centerY = 200;

  return (
    <div className="flex flex-col items-center">
      <h4 className="text-sm font-semibold text-slate-900 mb-3">{title}</h4>
      <svg width="400" height="400" viewBox="0 0 400 400" className="border border-slate-200 rounded-lg">
        {/* Center circle */}
        <circle cx={centerX} cy={centerY} r="30" fill="#f15b27" opacity="0.2" stroke="#f15b27" strokeWidth="2" />
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dy="0.3em"
          className="text-xs font-bold"
          fill="#0f172a"
        >
          Seed
        </text>

        {/* Spokes and labels */}
        {entries.map(([label, count], idx) => {
          const angle = angleSlice * idx - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          const value = Number(count) || 0;

          return (
            <g key={label}>
              {/* Spoke */}
              <line
                x1={centerX}
                y1={centerY}
                x2={x}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />

              {/* Circle node */}
              <circle cx={x} cy={y} r="20" fill="#f15b27" opacity="0.1" stroke="#f15b27" strokeWidth="2" />

              {/* Count */}
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dy="0.3em"
                className="text-xs font-bold"
                fill="#0f172a"
              >
                {value}
              </text>

              {/* Label */}
              <text
                x={x + (x > centerX ? 30 : -30)}
                y={y}
                textAnchor={x > centerX ? "start" : "end"}
                dy="0.3em"
                className="text-xs"
                fill="#64748b"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function KeywordClusterPage() {
  const [viewMode, setViewMode] = useState<"platform" | "intent" | "seed">("platform");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKeywordClusters();
  }, [viewMode]);

  async function fetchKeywordClusters() {
    setLoading(true);
    try {
      const response = await fetch(`/api/keyword-clusters?view=${viewMode}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch keyword clusters:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Keyword Clusters</h1>
        <p className="text-slate-600 mt-2">Visualize your keywords organized by different hierarchies</p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-3 mb-8 pb-6 border-b border-slate-200">
        <button
          onClick={() => setViewMode("platform")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            viewMode === "platform"
              ? "bg-[#f15b27] text-white"
              : "bg-white border border-slate-200 text-slate-700 hover:border-[#f15b27]"
          }`}
        >
          By Platform
        </button>
        <button
          onClick={() => setViewMode("intent")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            viewMode === "intent"
              ? "bg-[#f15b27] text-white"
              : "bg-white border border-slate-200 text-slate-700 hover:border-[#f15b27]"
          }`}
        >
          By Intent
        </button>
        <button
          onClick={() => setViewMode("seed")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            viewMode === "seed"
              ? "bg-[#f15b27] text-white"
              : "bg-white border border-slate-200 text-slate-700 hover:border-[#f15b27]"
          }`}
        >
          By Seed
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#f15b27]"></div>
            <p className="mt-4 text-slate-600">Loading cluster data...</p>
          </div>
        </div>
      )}

      {/* Wheels Grid */}
      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {Object.entries(data.clusters || {}).map(([category, clusterData]: [string, any]) => (
            <div key={category} className="bg-white rounded-lg border border-slate-100 p-6">
                      {(() => {
                        const total = Object.values(clusterData as Record<string, number>).reduce(
                          (a, b) => a + (Number(b) || 0),
                          0
                        );
                        return (
              <KeywordWheel
                data={clusterData}
                        title={`${category} (${total} keywords)`}
              />
                        );
                      })()}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && (!data || Object.keys(data.clusters || {}).length === 0) && (
        <div className="bg-white rounded-lg border border-slate-100 p-12 text-center">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p className="text-slate-600 font-medium">No keyword clusters yet</p>
          <p className="text-slate-500 mt-2">Run keyword discovery to generate clusters</p>
        </div>
      )}
    </div>
  );
}
