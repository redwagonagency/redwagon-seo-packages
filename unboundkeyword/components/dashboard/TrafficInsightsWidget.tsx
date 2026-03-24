"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { AnalyticsSummary } from "@/app/api/analytics/summary/route";

type Status = "loading" | "ok" | "error" | "empty";

export default function TrafficInsightsWidget() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    fetch("/api/analytics/summary")
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        const json = (await res.json()) as AnalyticsSummary;
        setData(json);
        setStatus(json.ga4 || json.gsc ? "ok" : "empty");
      })
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-6 animate-pulse">
        <div className="h-4 w-48 bg-slate-100 rounded mb-4" />
        <div className="h-40 bg-slate-50 rounded" />
      </div>
    );
  }

  if (status === "error" || status === "empty" || !data) {
    return null; // Don't show anything if data can't be fetched
  }

  const { ga4, gsc, startDate, endDate } = data;
  const dateLabel = `${startDate} → ${endDate}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white mb-6 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-[#f15b27] font-black mb-0.5">
            Live Data
          </div>
          <h2 className="text-lg font-black text-slate-900">Traffic &amp; Search Performance</h2>
        </div>
        <span className="text-xs text-slate-400 font-medium">{dateLabel} (30 days)</span>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
        <Kpi
          label="Sessions"
          value={ga4 ? ga4.totalSessions.toLocaleString() : "—"}
          note="GA4"
          color="#f15b27"
        />
        <Kpi
          label="Active Users"
          value={ga4 ? ga4.totalUsers.toLocaleString() : "—"}
          note="GA4"
          color="#1a56db"
        />
        <Kpi
          label="Organic Clicks"
          value={gsc ? gsc.totalClicks.toLocaleString() : "—"}
          note="Search Console"
          color="#059669"
        />
        <Kpi
          label="Impressions"
          value={gsc ? gsc.totalImpressions.toLocaleString() : "—"}
          note="Search Console"
          color="#7c3aed"
        />
      </div>

      <div className="grid xl:grid-cols-[1.3fr_1fr] divide-y xl:divide-y-0 xl:divide-x divide-slate-100">
        {/* GA4 Sessions Chart */}
        {ga4 && ga4.sessions.length > 0 ? (
          <div className="p-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4">
              Sessions per day <span className="text-slate-400 font-normal">(GA4)</span>
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ga4.sessions} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => {
                    const d = new Date(v + "T00:00:00");
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  interval={6}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                  labelFormatter={(l) => new Date(String(l) + "T00:00:00").toLocaleDateString()}
                />
                <Bar dataKey="sessions" fill="#f15b27" radius={[3, 3, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : ga4 ? (
          <div className="p-6 flex items-center justify-center text-sm text-slate-400">
            No GA4 session data for this period
          </div>
        ) : null}

        {/* GSC Keywords Table */}
        {gsc && gsc.keywords.length > 0 ? (
          <div className="p-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4">
              Top keywords driving traffic{" "}
              <span className="text-slate-400 font-normal">(Search Console)</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left pb-2 text-xs font-semibold text-slate-400 w-full">Keyword</th>
                    <th className="text-right pb-2 text-xs font-semibold text-slate-400 pr-0 whitespace-nowrap">Clicks</th>
                    <th className="text-right pb-2 text-xs font-semibold text-slate-400 pl-3 whitespace-nowrap">Impr.</th>
                    <th className="text-right pb-2 text-xs font-semibold text-slate-400 pl-3 whitespace-nowrap">Pos.</th>
                  </tr>
                </thead>
                <tbody>
                  {gsc.keywords.slice(0, 15).map((kw, i) => (
                    <tr
                      key={kw.keyword}
                      className="border-b border-slate-50 hover:bg-slate-50 transition"
                    >
                      <td className="py-1.5 pr-2 font-medium text-slate-800 max-w-[160px] truncate">
                        <span className="text-slate-300 text-xs mr-1.5">{i + 1}</span>
                        {kw.keyword}
                      </td>
                      <td className="py-1.5 text-right text-slate-700 font-bold text-[#f15b27]">
                        {kw.clicks.toLocaleString()}
                      </td>
                      <td className="py-1.5 text-right text-slate-500 pl-3">
                        {kw.impressions.toLocaleString()}
                      </td>
                      <td className="py-1.5 text-right pl-3">
                        <PositionBadge pos={kw.position} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : gsc ? (
          <div className="p-6 flex items-center justify-center text-sm text-slate-400">
            No GSC keyword data found for this site
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  note,
  color,
}: {
  label: string;
  value: string;
  note: string;
  color: string;
}) {
  return (
    <div className="px-5 py-4">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-2xl font-black" style={{ color: value === "—" ? "#cbd5e1" : color }}>
        {value}
      </div>
      <div className="text-[10px] text-slate-300 mt-0.5">{note}</div>
    </div>
  );
}

function PositionBadge({ pos }: { pos: number }) {
  const color =
    pos <= 3 ? "#059669" : pos <= 10 ? "#0891b2" : pos <= 20 ? "#d97706" : "#94a3b8";
  return (
    <span className="text-xs font-bold" style={{ color }}>
      #{pos}
    </span>
  );
}
