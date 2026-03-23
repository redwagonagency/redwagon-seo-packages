"use client";

import { useState } from "react";

type Props = {
  ga4Connected: boolean;
  gscConnected: boolean;
};

export default function IntegrationConnectPanel({ ga4Connected, gscConnected }: Props) {
  const [ga4, setGa4] = useState(ga4Connected);
  const [gsc, setGsc] = useState(gscConnected);
  const [busy, setBusy] = useState<"ga4" | "gsc" | null>(null);
  const [message, setMessage] = useState("");

  async function connect(type: "ga4" | "gsc") {
    setBusy(type);
    setMessage("");
    try {
      const res = await fetch("/api/sites/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = (await res.json()) as { error?: string; needsGoogleAuth?: boolean };
      if (!res.ok) {
        if (data.needsGoogleAuth) {
          window.location.href = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(`/dashboard?autoConnect=${type}`)}`;
          return;
        }
        throw new Error(data.error || "Connection failed");
      }
      if (type === "ga4") setGa4(true);
      if (type === "gsc") setGsc(true);
      setMessage("Connected successfully");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-xs uppercase tracking-[0.16em] text-[#f15b27] font-black mb-2">Google Integrations</div>
      <h3 className="text-xl font-black text-slate-900 mb-4">Connect with Google</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void connect("ga4")}
          disabled={busy !== null || ga4}
          className="rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-[#f15b27] transition disabled:opacity-60"
        >
          <div className="text-sm font-bold text-slate-900">GA4</div>
          <div className="text-xs text-slate-500 mt-1">{ga4 ? "Connected" : "Connect Google Analytics 4"}</div>
        </button>
        <button
          type="button"
          onClick={() => void connect("gsc")}
          disabled={busy !== null || gsc}
          className="rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-[#f15b27] transition disabled:opacity-60"
        >
          <div className="text-sm font-bold text-slate-900">Search Console</div>
          <div className="text-xs text-slate-500 mt-1">{gsc ? "Connected" : "Connect Google Search Console"}</div>
        </button>
      </div>
      {message ? <p className="text-xs text-slate-500 mt-3">{message}</p> : null}
    </div>
  );
}
