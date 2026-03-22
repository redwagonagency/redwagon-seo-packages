"use client";

import { useState } from "react";

type Stat = {
  industry: string;
  metricKey: string;
  metricValue: number;
  unit: string | null;
  note: string | null;
};

export default function SuperadminIndustryStatsManager({ initialStats }: { initialStats: Stat[] }) {
  const [stats, setStats] = useState<Stat[]>(initialStats);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    industry: "general",
    metricKey: "avg_organic_ctr",
    metricValue: "3.5",
    unit: "%",
    note: "",
    source: "",
  });

  async function saveStat() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/superadmin/industry-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: form.industry,
          metricKey: form.metricKey,
          metricValue: Number(form.metricValue),
          unit: form.unit,
          note: form.note,
          source: form.source,
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Unable to save stat");

      const refreshed = await fetch("/api/superadmin/industry-stats", { cache: "no-store" });
      const refreshedData = (await refreshed.json()) as { stats?: Stat[]; error?: string };
      if (!refreshed.ok) throw new Error(refreshedData.error || "Unable to refresh stats");
      setStats(refreshedData.stats || []);
      setMessage("Saved");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 p-3 grid gap-2 md:grid-cols-2">
        <input
          value={form.industry}
          onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))}
          placeholder="industry (general, local-seo...)"
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
        <input
          value={form.metricKey}
          onChange={(e) => setForm((prev) => ({ ...prev, metricKey: e.target.value }))}
          placeholder="metric key"
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
        <input
          value={form.metricValue}
          onChange={(e) => setForm((prev) => ({ ...prev, metricValue: e.target.value }))}
          placeholder="value"
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
        <input
          value={form.unit}
          onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
          placeholder="unit"
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
        <input
          value={form.note}
          onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
          placeholder="note"
          className="rounded border border-slate-300 px-2 py-1.5 text-sm md:col-span-2"
        />
        <input
          value={form.source}
          onChange={(e) => setForm((prev) => ({ ...prev, source: e.target.value }))}
          placeholder="source"
          className="rounded border border-slate-300 px-2 py-1.5 text-sm md:col-span-2"
        />
        <button
          onClick={saveStat}
          disabled={saving}
          className="rounded bg-[#f15b27] px-3 py-2 text-sm font-semibold text-white hover:bg-[#d94e1f] disabled:opacity-60 md:col-span-2"
        >
          {saving ? "Saving..." : "Save Industry Stat"}
        </button>
      </div>

      {message ? <p className="text-xs text-slate-600">{message}</p> : null}

      <div className="space-y-2 max-h-[250px] overflow-auto pr-1">
        {stats.length === 0 ? (
          <p className="text-sm text-slate-500">No industry stats yet.</p>
        ) : (
          stats.map((stat) => (
            <div key={`${stat.industry}-${stat.metricKey}`} className="rounded-lg border border-slate-200 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">{stat.industry}</p>
              <p className="text-sm font-semibold text-slate-900">
                {stat.metricKey}: {stat.metricValue.toLocaleString()}{stat.unit ? ` ${stat.unit}` : ""}
              </p>
              {stat.note ? <p className="text-xs text-slate-600 mt-1">{stat.note}</p> : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
