"use client";

import { useState } from "react";

type Props = {
  ga4Connected: boolean;
  gscConnected: boolean;
};

export default function IntegrationConnectPanel({ ga4Connected, gscConnected }: Props) {
  const [ga4] = useState(ga4Connected);
  const [gsc] = useState(gscConnected);

  function connectGoogle(type: "ga4" | "gsc") {
    window.location.href = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(`/dashboard?autoConnect=${type}`)}`;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-xs uppercase tracking-[0.16em] text-[#f15b27] font-black mb-2">Google Integrations</div>
      <h3 className="text-xl font-black text-slate-900 mb-1">Connect with Google</h3>
      <p className="text-xs text-slate-500 mb-4">Authorize UnboundKeyword through your Google account to pull in live data.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => connectGoogle("ga4")}
          disabled={ga4}
          className="rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-[#f15b27] transition disabled:opacity-60"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#f15b27]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <div className="text-sm font-bold text-slate-900">Google Analytics 4</div>
          </div>
          <div className="text-xs text-slate-500 mt-1">{ga4 ? "✓ Connected" : "Authorize & connect GA4 →"}</div>
        </button>
        <button
          type="button"
          onClick={() => connectGoogle("gsc")}
          disabled={gsc}
          className="rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-[#f15b27] transition disabled:opacity-60"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#f15b27]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <div className="text-sm font-bold text-slate-900">Search Console</div>
          </div>
          <div className="text-xs text-slate-500 mt-1">{gsc ? "✓ Connected" : "Authorize & connect GSC →"}</div>
        </button>
      </div>
    </div>
  );
}
