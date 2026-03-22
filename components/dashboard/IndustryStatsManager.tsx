"use client";

import { useState } from "react";

type Stat = {
  industry: string;
  metricKey: string;
  metricValue: number;
  unit: string | null;
  note: string | null;
};

export default function IndustryStatsManager({ initialStats }: { initialStats: Stat[] }) {
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
      if (!res.ok) throw new Error(data.error || "Failed to save stat");

      const refreshRes = await fetch("/api/superadmin/industry-stats", { cache: "no-store" });
      const refreshData = (await refreshRes.json()) as { stats?: Stat[]; error?: string };
      if (!refreshRes.ok) throw new Error(refreshData.error || "Unable to refresh stats");

      setStats(refreshData.stats || []);
      setMessage("Saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginBottom: 12 }}>
        <input value={form.industry} onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))} placeholder="industry" style={inputStyle} />
        <input value={form.metricKey} onChange={(e) => setForm((p) => ({ ...p, metricKey: e.target.value }))} placeholder="metric key" style={inputStyle} />
        <input value={form.metricValue} onChange={(e) => setForm((p) => ({ ...p, metricValue: e.target.value }))} placeholder="value" style={inputStyle} />
        <input value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} placeholder="unit" style={inputStyle} />
        <input value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="note" style={{ ...inputStyle, gridColumn: "1 / -1" }} />
        <input value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))} placeholder="source" style={{ ...inputStyle, gridColumn: "1 / -1" }} />
      </div>

      <button
        onClick={saveStat}
        disabled={saving}
        style={{
          border: "none",
          borderRadius: 8,
          background: "#1a56db",
          color: "#fff",
          padding: "10px 14px",
          fontSize: 13,
          fontWeight: 700,
          cursor: saving ? "default" : "pointer",
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? "Saving..." : "Save Industry Stat"}
      </button>

      {message ? <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>{message}</p> : null}

      <div style={{ marginTop: 14, maxHeight: 300, overflowY: "auto", display: "grid", gap: 8 }}>
        {stats.map((stat) => (
          <div key={`${stat.industry}-${stat.metricKey}`} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 12px" }}>
            <p style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>{stat.industry}</p>
            <p style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 700 }}>
              {stat.metricKey}: {stat.metricValue.toLocaleString()}{stat.unit ? ` ${stat.unit}` : ""}
            </p>
            {stat.note ? <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{stat.note}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  background: "rgba(255,255,255,0.03)",
  color: "#e2e8f0",
  fontSize: 13,
  padding: "8px 10px",
};
