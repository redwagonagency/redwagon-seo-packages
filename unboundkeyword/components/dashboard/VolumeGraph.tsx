"use client";

import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface VolumeData {
  date: string;
  desktopVolume: number;
  mobileVolume: number;
  totalVolume: number;
}

interface VolumeGraphProps {
  keyword: string;
  data: VolumeData[];
  platform?: string;
}

export default function VolumeGraph({ keyword, data, platform = "Google" }: VolumeGraphProps) {
  const [viewType, setViewType] = useState<"desktop" | "mobile" | "combined">("combined");
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-100 p-8 text-center">
        <p className="text-slate-500 text-sm">No historical data available yet. Search activity will be tracked over time.</p>
      </div>
    );
  }

  const ChartComponent = chartType === "line" ? LineChart : BarChart;
  const DataComponent = chartType === "line" ? Line : Bar;

  return (
    <div className="bg-white rounded-lg border border-slate-100 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">{keyword}</h3>
        <p className="text-sm text-slate-500">{platform} Search Volume Trends</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="flex gap-2">
          <button
            onClick={() => setViewType("desktop")}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              viewType === "desktop"
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Desktop
          </button>
          <button
            onClick={() => setViewType("mobile")}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              viewType === "mobile"
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Mobile
          </button>
          <button
            onClick={() => setViewType("combined")}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              viewType === "combined"
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Combined
          </button>
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setChartType("line")}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              chartType === "line"
                ? "bg-orange-100 text-orange-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              chartType === "bar"
                ? "bg-orange-100 text-orange-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Bar
          </button>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 12 }} />
          <YAxis stroke="#64748b" style={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: "#1e293b",
              border: "1px solid #475569",
              borderRadius: "8px",
              color: "#f1f5f9",
            }}
            formatter={(value) => {
              const num = typeof value === "number" ? value : Number(value ?? 0);
              return num.toLocaleString();
            }}
          />
          {viewType === "desktop" && (
            <>
              <Legend />
              <DataComponent dataKey="desktopVolume" stroke="#1e40af" fill="#3b82f6" name="Desktop Volume" />
            </>
          )}
          {viewType === "mobile" && (
            <>
              <Legend />
              <DataComponent dataKey="mobileVolume" stroke="#7c2d12" fill="#ff7a4d" name="Mobile Volume" />
            </>
          )}
          {viewType === "combined" && (
            <>
              <Legend />
              <DataComponent dataKey="desktopVolume" stroke="#1e40af" fill="#3b82f6" name="Desktop" />
              <DataComponent dataKey="mobileVolume" stroke="#7c2d12" fill="#ff7a4d" name="Mobile" />
              <DataComponent dataKey="totalVolume" stroke="#7c3aed" fill="#a855f7" name="Total" />
            </>
          )}
        </ChartComponent>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {data.length > 0 && (
          <>
            <div className="bg-blue-50 rounded p-3 text-center">
              <p className="text-xs text-slate-600 mb-1">Avg Desktop</p>
              <p className="text-lg font-bold text-blue-700">
                {Math.round(data.reduce((sum, d) => sum + d.desktopVolume, 0) / data.length).toLocaleString()}
              </p>
            </div>
            <div className="bg-orange-50 rounded p-3 text-center">
              <p className="text-xs text-slate-600 mb-1">Avg Mobile</p>
              <p className="text-lg font-bold text-orange-700">
                {Math.round(data.reduce((sum, d) => sum + d.mobileVolume, 0) / data.length).toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-50 rounded p-3 text-center">
              <p className="text-xs text-slate-600 mb-1">Avg Total</p>
              <p className="text-lg font-bold text-purple-700">
                {Math.round(data.reduce((sum, d) => sum + d.totalVolume, 0) / data.length).toLocaleString()}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
