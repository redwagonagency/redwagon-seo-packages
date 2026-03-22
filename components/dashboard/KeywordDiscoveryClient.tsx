"use client";

import { useMemo, useState } from "react";

type KeywordRow = {
  keyword: string;
  volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  intent: string | null;
  competition: number | null;
  trend: number[];
};

export default function KeywordDiscoveryClient({ projectId }: { projectId: string | null }) {
  const [seed, setSeed] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<KeywordRow[]>([]);
  const [sortBy, setSortBy] = useState<"volume" | "difficulty" | "cpc">("volume");

  const sorted = useMemo(() => {
    const list = [...rows];
    if (sortBy === "volume") return list.sort((a, b) => (b.volume || 0) - (a.volume || 0));
    if (sortBy === "difficulty") return list.sort((a, b) => (a.difficulty || 0) - (b.difficulty || 0));
    return list.sort((a, b) => (b.cpc || 0) - (a.cpc || 0));
  }, [rows, sortBy]);

  const suggestionTokens = useMemo(() => {
    const s = seed.trim().toLowerCase();
    if (!s) return [] as string[];
    return [
      `${s} vs`,
      `${s} alternatives`,
      `${s} pricing`,
      `best ${s}`,
      `${s} for small business`,
      `${s} reviews`,
      `how to use ${s}`,
      `${s} comparison`,
    ];
  }, [seed]);

  async function run() {
    const query = seed.trim();
    if (!query) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/keyword-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: [query], mode: "magic", projectId }),
      });
      const data = (await res.json()) as { results?: KeywordRow[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Unable to run discovery");
      setRows(data.results || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to run discovery");
    } finally {
      setLoading(false);
    }
  }

  async function saveAll() {
    if (!projectId || rows.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/keyword-research/save-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, keywords: rows, source: "discovery" }),
      });
      const data = (await res.json()) as { error?: string; savedCount?: number };
      if (!res.ok) throw new Error(data.error || "Failed to save");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Keyword Discovery</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 14 }}>
          Discover variations, comparison terms, and intent opportunities from one seed keyword.
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="example: seo audit tool"
            style={{ flex: 1, border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", fontSize: 14 }}
          />
          <button
            onClick={run}
            disabled={loading || !seed.trim()}
            style={{ border: "none", borderRadius: 8, padding: "0 16px", background: loading ? "#93c5fd" : "#1a56db", color: "#fff", fontWeight: 700, cursor: "pointer" }}
          >
            {loading ? "Discovering..." : "Run Discovery"}
          </button>
          <button
            onClick={saveAll}
            disabled={saving || rows.length === 0 || !projectId}
            style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "0 14px", background: "#fff", color: "#1e293b", fontWeight: 700, cursor: "pointer" }}
          >
            {saving ? "Saving..." : "Save All"}
          </button>
        </div>

        {suggestionTokens.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {suggestionTokens.map((token) => (
              <button key={token} onClick={() => setSeed(token)} style={{ border: "1px solid #dbeafe", background: "#eff6ff", color: "#1d4ed8", borderRadius: 999, fontSize: 12, padding: "4px 10px", cursor: "pointer" }}>
                {token}
              </button>
            ))}
          </div>
        ) : null}

        {error ? <p style={{ color: "#ef4444", fontSize: 13, marginTop: 10 }}>{error}</p> : null}
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{rows.length} discovered keywords</span>
          <div style={{ display: "flex", gap: 8 }}>
            {(["volume", "difficulty", "cpc"] as const).map((key) => (
              <button key={key} onClick={() => setSortBy(key)} style={{ border: `1px solid ${sortBy === key ? "#1a56db" : "#cbd5e1"}`, background: sortBy === key ? "#eff6ff" : "#fff", color: sortBy === key ? "#1a56db" : "#64748b", borderRadius: 6, fontSize: 12, padding: "4px 8px", fontWeight: 700, cursor: "pointer" }}>
                {key === "volume" ? "Volume" : key === "difficulty" ? "KD" : "CPC"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Keyword", "Volume", "KD", "CPC", "Intent"].map((col) => (
                  <th key={col} style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, color: "#64748b", borderBottom: "1px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.08em" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 120).map((row, i) => (
                <tr key={`${row.keyword}-${i}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 12px", fontSize: 14, color: "#0f172a", fontWeight: 600 }}>{row.keyword}</td>
                  <td style={{ padding: "10px 12px", fontSize: 14, color: "#0f172a" }}>{formatVolume(row.volume)}</td>
                  <td style={{ padding: "10px 12px", fontSize: 14, color: kdColor(row.difficulty), fontWeight: 700 }}>{row.difficulty ?? "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 13, color: "#334155" }}>{row.cpc != null ? `$${row.cpc.toFixed(2)}` : "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: "#64748b", textTransform: "capitalize" }}>{row.intent || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function kdColor(value: number | null): string {
  if (value == null) return "#94a3b8";
  if (value <= 30) return "#10b981";
  if (value <= 60) return "#f59e0b";
  return "#ef4444";
}

function formatVolume(v: number | null): string {
  if (v == null) return "—";
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${Math.round(v / 1000)}K`;
  return String(v);
}
