"use client";

import { useMemo, useState } from "react";

type ProductKeyword = {
  keyword: string;
  volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  intent: string | null;
};

type ResponseShape = {
  product: string;
  results: ProductKeyword[];
  groups: {
    comparisons: ProductKeyword[];
    buyingIntent: ProductKeyword[];
    informational: ProductKeyword[];
  };
};

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 22,
};

export default function ProductKeywordsClient({ projectId }: { projectId: string | null }) {
  const [product, setProduct] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ResponseShape | null>(null);

  const topRows = useMemo(() => data?.results.slice(0, 40) ?? [], [data]);

  async function run() {
    if (!projectId || !product.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/product-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, product: product.trim() }),
      });
      const json = (await res.json()) as ResponseShape & { error?: string };
      if (!res.ok) throw new Error(json.error || "Failed");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to run analysis");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Product Keywords</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>
          Product-focused keyword discovery with comparison and buying-intent variations.
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="example: seo audit software"
            style={{
              flex: 1,
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "11px 12px",
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            onClick={run}
            disabled={loading || !projectId || !product.trim()}
            style={{
              border: "none",
              borderRadius: 8,
              background: loading ? "#93c5fd" : "#1a56db",
              color: "#fff",
              padding: "0 18px",
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Analyzing..." : "Find Product Keywords"}
          </button>
        </div>

        {!projectId ? <p style={{ color: "#ef4444", fontSize: 13, marginTop: 10 }}>Create/select a project first.</p> : null}
        {error ? <p style={{ color: "#ef4444", fontSize: 13, marginTop: 10 }}>{error}</p> : null}
      </div>

      {data ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
            <Insight title="Comparison Searches" value={data.groups.comparisons.length} subtitle="vs, alternatives, reviews" color="#7c3aed" />
            <Insight title="Buying Intent" value={data.groups.buyingIntent.length} subtitle="price, cost, buy, quotes" color="#059669" />
            <Insight title="Informational" value={data.groups.informational.length} subtitle="how, what, guide queries" color="#d97706" />
          </div>

          <div style={cardStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Top Product Keyword Opportunities</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {[
                      "Keyword",
                      "Volume",
                      "KD",
                      "CPC",
                      "Intent",
                    ].map((col) => (
                      <th key={col} style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, color: "#64748b", borderBottom: "1px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topRows.map((row, index) => (
                    <tr key={`${row.keyword}-${index}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
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
        </>
      ) : null}
    </div>
  );
}

function Insight({ title, value, subtitle, color }: { title: string; value: number; subtitle: string; color: string }) {
  return (
    <div style={{ ...cardStyle, padding: 16 }}>
      <p style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{title}</p>
      <p style={{ fontSize: 32, fontWeight: 800, color }}>{value}</p>
      <p style={{ fontSize: 12, color: "#94a3b8" }}>{subtitle}</p>
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
