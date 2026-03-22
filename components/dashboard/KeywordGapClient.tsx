"use client";

import { useState } from "react";

type GapRow = {
  keyword: string;
  yourPosition: number | null;
  competitorPositions: Array<{ domain: string; position: number | null }>;
  volume: number | null;
  opportunity: "missing" | "weak" | "strong";
};

export default function KeywordGapClient({ projectId }: { projectId: string | null }) {
  const [competitors, setCompetitors] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<GapRow[]>([]);

  async function runGap() {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    try {
      const comp = competitors
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean);

      const res = await fetch("/api/keyword-research/gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, competitors: comp }),
      });

      const data = (await res.json()) as { gaps?: GapRow[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Unable to run keyword gap");
      setRows(data.gaps || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to run keyword gap");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Keyword Gap</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 14 }}>
          Compare your domain against competitors and uncover missing keyword opportunities.
        </p>

        <textarea
          value={competitors}
          onChange={(e) => setCompetitors(e.target.value)}
          placeholder="competitor1.com\ncompetitor2.com"
          style={{ width: "100%", minHeight: 90, border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", fontSize: 14, marginBottom: 10 }}
        />

        <button
          onClick={runGap}
          disabled={loading || !projectId}
          style={{ border: "none", borderRadius: 8, background: loading ? "#93c5fd" : "#1a56db", color: "#fff", padding: "10px 18px", fontWeight: 700, cursor: "pointer" }}
        >
          {loading ? "Analyzing..." : "Run Keyword Gap"}
        </button>

        {!projectId ? <p style={{ color: "#ef4444", fontSize: 13, marginTop: 10 }}>Create/select a project first.</p> : null}
        {error ? <p style={{ color: "#ef4444", fontSize: 13, marginTop: 10 }}>{error}</p> : null}
      </div>

      {rows.length > 0 ? (
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
            {rows.length} opportunities found
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Keyword", "Volume", "Your Pos", "Top Competitor", "Opportunity"].map((col) => (
                    <th key={col} style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, color: "#64748b", borderBottom: "1px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.08em" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 120).map((row, i) => {
                  const top = row.competitorPositions.find((item) => item.position != null) || row.competitorPositions[0];
                  return (
                    <tr key={`${row.keyword}-${i}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 12px", fontSize: 14, color: "#0f172a", fontWeight: 600 }}>{row.keyword}</td>
                      <td style={{ padding: "10px 12px", fontSize: 14, color: "#0f172a" }}>{formatVolume(row.volume)}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#334155" }}>{row.yourPosition ?? "—"}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#334155" }}>
                        {top?.domain || "—"} {top?.position != null ? `#${top.position}` : ""}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 999,
                          padding: "3px 9px",
                          background: row.opportunity === "missing" ? "#fee2e2" : row.opportunity === "weak" ? "#fef3c7" : "#e2e8f0",
                          color: row.opportunity === "missing" ? "#991b1b" : row.opportunity === "weak" ? "#92400e" : "#334155",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}>
                          {row.opportunity}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatVolume(v: number | null): string {
  if (v == null) return "—";
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${Math.round(v / 1000)}K`;
  return String(v);
}
