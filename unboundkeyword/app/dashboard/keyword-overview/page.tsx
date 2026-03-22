"use client";

import { useMemo, useState } from "react";
import { formatNumber } from "@/lib/utils";

type Bucket = {
  title: string;
  totalVolume: string;
  rows: Array<{ keyword: string; volume: number }>;
};

const MONTHS = ["Jul 2024", "Aug 2024", "Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024", "Jan 2025", "Feb 2025", "Mar 2025", "Apr 2025", "May 2025", "Jun 2025"];

const MOBILE = [8000, 9800, 8100, 8100, 12100, 12100, 14800, 9800, 9800, 8200, 6600, 9900];
const DESKTOP = [6500, 8100, 6500, 6500, 9900, 9900, 12100, 8100, 8100, 6600, 5400, 8100];

const BUCKETS: Bucket[] = [
  {
    title: "Suggestions",
    totalVolume: "269.0k",
    rows: [
      { keyword: "marketing digital marketing", volume: 165000 },
      { keyword: "marketing digital jobs", volume: 27100 },
      { keyword: "marketing digital online courses", volume: 8100 },
      { keyword: "marketing digital strategy", volume: 5400 },
    ],
  },
  {
    title: "Questions",
    totalVolume: "8.4k",
    rows: [
      { keyword: "what digital marketing do", volume: 1600 },
      { keyword: "how do digital marketing", volume: 1600 },
      { keyword: "what is digital marketing strategy", volume: 720 },
      { keyword: "how digital marketing", volume: 720 },
    ],
  },
  {
    title: "Prepositions",
    totalVolume: "790",
    rows: [
      { keyword: "marketing and digital coordination", volume: 590 },
      { keyword: "for digital marketing", volume: 40 },
      { keyword: "near digital marketing", volume: 30 },
      { keyword: "digital marketing without software", volume: 30 },
    ],
  },
  {
    title: "Comparisons",
    totalVolume: "5.1k",
    rows: [
      { keyword: "marketing digital course", volume: 22200 },
      { keyword: "marketing digital freelance", volume: 18100 },
      { keyword: "digital marketing as a career", volume: 1300 },
      { keyword: "digital marketing as a business", volume: 1300 },
    ],
  },
];

export default function KeywordOverviewPage() {
  const [keyword, setKeyword] = useState("digital marketing");

  const chart = useMemo(() => {
    const max = Math.max(1, ...MOBILE, ...DESKTOP);
    const mobilePath = MOBILE.map((value, idx) => {
      const x = (idx / (MOBILE.length - 1)) * 980;
      const y = 280 - (value / max) * 220;
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");

    const desktopPath = DESKTOP.map((value, idx) => {
      const x = (idx / (DESKTOP.length - 1)) * 980;
      const y = 280 - (value / max) * 220;
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");

    return { mobilePath, desktopPath };
  }, []);

  return (
    <div className="p-8 max-w-7xl">
      <div className="rounded-xl border border-slate-200 bg-white p-6 mb-6">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">Keyword Research</div>
        <h1 className="text-3xl font-black text-slate-900 mb-4">Keyword Overview</h1>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none"
            placeholder="enter a keyword"
          />
          <button type="button" className="rounded-lg bg-[#f15b27] px-8 py-3 text-sm font-black text-white hover:bg-[#d94e1f]">
            SEARCH
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-6">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 mb-3">Search Volume History</div>
        <div className="flex justify-end gap-4 text-xs mb-2">
          <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="w-3 h-3 bg-[#f15b27] inline-block" />Mobile Volume</span>
          <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="w-3 h-3 bg-[#f7cc67] inline-block" />Desktop Volume</span>
        </div>

        <svg viewBox="0 0 1060 340" className="w-full h-[340px]">
          {[5000, 10000, 15000].map((tick, idx) => {
            const y = 300 - (tick / 15000) * 240;
            return (
              <g key={tick}>
                <line x1={80} y1={y} x2={1030} y2={y} stroke="#e2e8f0" />
                <text x={25} y={y + 4} fontSize="11" fill="#94a3b8">{formatNumber(tick)}</text>
              </g>
            );
          })}

          <path d={chart.mobilePath} transform="translate(80,20)" fill="none" stroke="#f15b27" strokeWidth="3" />
          <path d={chart.desktopPath} transform="translate(80,20)" fill="none" stroke="#f7cc67" strokeWidth="3" />

          {MOBILE.map((value, idx) => {
            const x = (idx / (MOBILE.length - 1)) * 980 + 80;
            const y = 300 - (value / 15000) * 240 + 20;
            return <circle key={`m-${idx}`} cx={x} cy={y} r="4" fill="#fff" stroke="#f15b27" strokeWidth="2" />;
          })}

          {DESKTOP.map((value, idx) => {
            const x = (idx / (DESKTOP.length - 1)) * 980 + 80;
            const y = 300 - (value / 15000) * 240 + 20;
            return <circle key={`d-${idx}`} cx={x} cy={y} r="4" fill="#fff" stroke="#f7cc67" strokeWidth="2" />;
          })}

          {MONTHS.map((month, idx) => {
            const x = (idx / (MONTHS.length - 1)) * 980 + 80;
            return <text key={month} x={x} y={332} textAnchor="middle" fontSize="11" fill="#94a3b8">{month}</text>;
          })}
        </svg>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {BUCKETS.map((bucket) => (
          <div key={bucket.title} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400 mb-1">{bucket.title}</div>
            <div className="text-3xl font-black text-slate-900 mb-2">{bucket.rows.length}</div>
            <div className="text-xs text-slate-500 mb-4">Total Volume: {bucket.totalVolume}</div>
            <div className="space-y-2">
              {bucket.rows.map((row) => (
                <div key={row.keyword} className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-slate-700 line-clamp-2">{row.keyword}</span>
                  <span className="text-slate-500 tabular-nums">{formatNumber(row.volume)}</span>
                </div>
              ))}
            </div>
            <button type="button" className="mt-4 text-xs font-bold text-[#f15b27] hover:underline">View all</button>
          </div>
        ))}
      </div>
    </div>
  );
}
