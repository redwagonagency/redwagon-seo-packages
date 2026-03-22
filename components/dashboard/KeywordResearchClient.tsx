"use client";

import { useState } from "react";

interface SavedKeyword {
  id: string;
  keyword: string;
  volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  intent: string | null;
  source: string;
  savedAt: string;
}

interface KeywordResult {
  keyword: string;
  volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  intent: string | null;
  competition: number | null;
  trend: number[];
}

interface KeywordGapResult {
  keyword: string;
  yourPosition: number | null;
  competitorPositions: { domain: string; position: number | null }[];
  volume: number | null;
  opportunity: "missing" | "weak" | "strong";
}

interface Props {
  projectId: string | null;
  projectDomain: string | null;
  plan: string;
  savedKeywords: SavedKeyword[];
}

const intentColors: Record<string, { bg: string; color: string; label: string }> = {
  informational: { bg: "#eff6ff", color: "#1d4ed8", label: "Info" },
  transactional: { bg: "#f0fdf4", color: "#15803d", label: "Trans" },
  commercial: { bg: "#fefce8", color: "#a16207", label: "Comm" },
  navigational: { bg: "#fdf4ff", color: "#7e22ce", label: "Nav" },
};

const diffColor = (d: number | null) =>
  d === null ? "#94a3b8" : d <= 30 ? "#10b981" : d <= 60 ? "#f59e0b" : "#ef4444";

const volFormat = (v: number | null) => {
  if (v === null) return "—";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
};

export default function KeywordResearchClient({
  projectId,
  projectDomain,
  plan,
  savedKeywords,
}: Props) {
  const [tab, setTab] = useState<"overview" | "magic" | "gap" | "saved">("overview");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [gapResults, setGapResults] = useState<KeywordGapResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedKeyword[]>(savedKeywords);
  const [sortBy, setSortBy] = useState<"volume" | "difficulty" | "cpc">("volume");
  const [importingGsc, setImportingGsc] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  async function runSearch(mode: "overview" | "magic" | "gap") {
    if (mode !== "gap" && !query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (mode === "gap" && !projectId) {
        throw new Error("Create a project first to run keyword gap analysis");
      }

      const res = await fetch("/api/keyword-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: query.split("\n").map((k) => k.trim()).filter(Boolean).slice(0, 20),
          mode,
          projectId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      if (mode === "gap") {
        setGapResults(data.results ?? []);
      } else {
        setResults(data.results ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function saveKeyword(kw: KeywordResult) {
    if (!projectId) return;
    try {
      const res = await fetch("/api/keyword-research/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, keyword: kw, source: tab }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save keyword");
      setSaved((prev) => [data.keyword, ...prev.filter((k) => k.keyword !== kw.keyword)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save keyword");
    }
  }

  async function saveAllKeywords() {
    if (!projectId || results.length === 0) return;
    setSavingAll(true);
    setError(null);
    try {
      const res = await fetch("/api/keyword-research/save-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          keywords: results,
          source: tab,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save all keywords");

      const incoming = (data.keywords ?? []) as SavedKeyword[];
      setSaved((prev) => {
        const next = new Map(prev.map((k) => [k.keyword.toLowerCase(), k]));
        for (const kw of incoming) {
          next.set(kw.keyword.toLowerCase(), kw);
        }
        return [...next.values()].sort(
          (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        );
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save all keywords");
    } finally {
      setSavingAll(false);
    }
  }

  async function importFromGsc() {
    if (!projectId) return;
    setImportingGsc(true);
    setError(null);
    try {
      const res = await fetch(`/api/gsc/import?projectId=${encodeURIComponent(projectId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to import from GSC");
      const keywords = (data.keywords ?? []) as string[];
      setQuery(keywords.slice(0, 20).join("\n"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to import from GSC");
    } finally {
      setImportingGsc(false);
    }
  }

  const sorted = [...results].sort((a, b) => {
    if (sortBy === "volume") return (b.volume ?? 0) - (a.volume ?? 0);
    if (sortBy === "difficulty") return (a.difficulty ?? 0) - (b.difficulty ?? 0);
    return (b.cpc ?? 0) - (a.cpc ?? 0);
  });

  const tabStyle = (id: string): React.CSSProperties => ({
    padding: "10px 18px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: tab === id ? 700 : 500,
    color: tab === id ? "#1a56db" : "#64748b",
    borderBottom: tab === id ? "2px solid #1a56db" : "2px solid transparent",
    marginBottom: -1,
    whiteSpace: "nowrap",
  });

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 32px" }}>
        <div style={{ padding: "16px 0 10px" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Keyword Research</h1>
          <p style={{ fontSize: 14, color: "#64748b" }}>
            {projectDomain ? `Researching for ${projectDomain}` : "Discover keywords, search volumes, and opportunities"}
          </p>
        </div>
        <div style={{ display: "flex", borderTop: "1px solid #f1f5f9", marginTop: 4 }}>
          {(["overview", "magic", "gap", "saved"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={tabStyle(t)}>
              {t === "overview" ? "Keyword Overview" : t === "magic" ? "Magic Tool" : t === "gap" ? "Keyword Gap" : `Saved (${saved.length})`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "28px 32px" }}>
        {(tab === "overview" || tab === "magic") && (
          <>
            {/* Search box */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                {tab === "overview" ? "Enter keywords to analyze (one per line, up to 20)" : "Enter seed keywords to expand (one per line)"}
              </p>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tab === "overview" ? "seo software\nkeyword research tool" : "seo\ndigital marketing"}
                style={{
                  width: "100%",
                  height: 100,
                  padding: "10px 14px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: "inherit",
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={() => runSearch(tab as "overview" | "magic")}
                disabled={loading || !query.trim()}
                style={{
                  marginTop: 12,
                  background: loading ? "#94a3b8" : "#1a56db",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 24px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? "default" : "pointer",
                }}
              >
                {loading ? "Analyzing…" : tab === "overview" ? "Get Keyword Data" : "Find Keywords"}
              </button>
              {tab === "overview" && projectId && (
                <button
                  onClick={importFromGsc}
                  disabled={importingGsc}
                  style={{
                    marginTop: 12,
                    marginLeft: 10,
                    background: importingGsc ? "#94a3b8" : "#f1f5f9",
                    color: importingGsc ? "#fff" : "#334155",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "10px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: importingGsc ? "default" : "pointer",
                  }}
                >
                  {importingGsc ? "Importing…" : "Import GSC Keywords"}
                </button>
              )}
              {error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 8 }}>{error}</p>}
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{results.length} keywords found</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {projectId && (
                      <button
                        onClick={saveAllKeywords}
                        disabled={savingAll}
                        style={{
                          fontSize: 12,
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: "1px solid #93c5fd",
                          background: savingAll ? "#94a3b8" : "#dbeafe",
                          color: "#1d4ed8",
                          cursor: savingAll ? "default" : "pointer",
                          fontWeight: 700,
                        }}
                      >
                        {savingAll ? "Saving..." : "Save all"}
                      </button>
                    )}
                    <span style={{ fontSize: 12, color: "#64748b" }}>Sort:</span>
                    {(["volume", "difficulty", "cpc"] as const).map((s) => (
                      <button key={s} onClick={() => setSortBy(s)} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, border: `1px solid ${sortBy === s ? "#1a56db" : "#e2e8f0"}`, background: sortBy === s ? "#eff6ff" : "#fff", color: sortBy === s ? "#1a56db" : "#64748b", cursor: "pointer", fontWeight: sortBy === s ? 700 : 400 }}>
                        {s === "volume" ? "Volume" : s === "difficulty" ? "KD" : "CPC"}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["Keyword", "Volume", "KD", "CPC", "Intent", "Trend", ""].map((col) => (
                          <th key={col} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((kw, i) => {
                        const intent = intentColors[kw.intent ?? ""] ?? null;
                        return (
                          <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                            <td style={{ padding: "12px 16px", fontSize: 14, color: "#0f172a", fontWeight: 500, maxWidth: 280 }}>
                              <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{kw.keyword}</span>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                              {volFormat(kw.volume)}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 14, fontWeight: 800, color: diffColor(kw.difficulty) }}>
                                  {kw.difficulty ?? "—"}
                                </span>
                                {kw.difficulty !== null && (
                                  <div style={{ width: 40, height: 4, background: "#f1f5f9", borderRadius: 2 }}>
                                    <div style={{ width: `${kw.difficulty}%`, height: "100%", background: diffColor(kw.difficulty), borderRadius: 2 }} />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>
                              {kw.cpc !== null ? `$${kw.cpc.toFixed(2)}` : "—"}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              {intent ? (
                                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: intent.bg, color: intent.color }}>
                                  {intent.label}
                                </span>
                              ) : "—"}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              {kw.trend.length > 0 && (
                                <svg width={48} height={18} viewBox="0 0 48 18">
                                  {kw.trend.slice(-6).map((val, ti, arr) => {
                                    const max = Math.max(...arr, 1);
                                    const x = (ti / (arr.length - 1)) * 44 + 2;
                                    const y = 16 - (val / max) * 14;
                                    return ti === 0 ? null : (
                                      <line key={ti}
                                        x1={(((ti - 1) / (arr.length - 1)) * 44 + 2)}
                                        y1={16 - (arr[ti - 1] / max) * 14}
                                        x2={x} y2={y}
                                        stroke="#1a56db" strokeWidth={1.5}
                                      />
                                    );
                                  })}
                                </svg>
                              )}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              {projectId && (
                                <button
                                  onClick={() => saveKeyword(kw)}
                                  style={{ fontSize: 11, color: "#1a56db", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}
                                >
                                  + Save
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Keyword Gap tab */}
        {tab === "gap" && (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: 24, borderBottom: "1px solid #f1f5f9" }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Keyword Gap Analysis</h2>
              <p style={{ fontSize: 14, color: "#64748b", marginBottom: 14 }}>
                Find keywords where competitors rank but your domain is missing or weak.
              </p>
              {projectId ? (
                <button
                  onClick={() => runSearch("gap")}
                  disabled={loading}
                  style={{
                    background: loading ? "#94a3b8" : "#1a56db",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: loading ? "default" : "pointer",
                  }}
                >
                  {loading ? "Analyzing…" : "Run Gap Analysis"}
                </button>
              ) : (
                <a href="/dashboard/projects" style={{ color: "#1a56db", fontWeight: 600 }}>Create a project first →</a>
              )}
              {error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 10 }}>{error}</p>}
            </div>

            {gapResults.length === 0 ? (
              <div style={{ padding: 24, fontSize: 13, color: "#94a3b8" }}>
                No gap data yet. Add competitor domains to your project and run analysis.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Keyword", "Opportunity", "Your Position", "Best Competitor", "Volume"].map((col) => (
                        <th key={col} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gapResults.map((row, i) => {
                      const bestCompetitor = row.competitorPositions
                        .filter((p) => p.position !== null)
                        .sort((a, b) => (a.position as number) - (b.position as number))[0];
                      const oppColor = row.opportunity === "missing" ? "#b91c1c" : row.opportunity === "weak" ? "#b45309" : "#166534";
                      const oppBg = row.opportunity === "missing" ? "#fee2e2" : row.opportunity === "weak" ? "#ffedd5" : "#dcfce7";

                      return (
                        <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                          <td style={{ padding: "11px 16px", fontSize: 14, color: "#0f172a", fontWeight: 600 }}>{row.keyword}</td>
                          <td style={{ padding: "11px 16px" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: oppColor, background: oppBg, borderRadius: 99, padding: "3px 8px" }}>
                              {row.opportunity}
                            </span>
                          </td>
                          <td style={{ padding: "11px 16px", fontSize: 13, color: "#374151" }}>{row.yourPosition !== null ? `#${row.yourPosition}` : "Not ranking"}</td>
                          <td style={{ padding: "11px 16px", fontSize: 13, color: "#374151" }}>
                            {bestCompetitor ? `${bestCompetitor.domain} (#${bestCompetitor.position})` : "—"}
                          </td>
                          <td style={{ padding: "11px 16px", fontSize: 13, color: "#374151" }}>{row.volume?.toLocaleString() ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Saved tab */}
        {tab === "saved" && (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                {saved.length} saved keywords
              </span>
            </div>
            {saved.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                No saved keywords yet. Search for keywords and click &ldquo;+ Save&rdquo;.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Keyword", "Volume", "KD", "CPC", "Intent", "Source", "Saved"].map((col) => (
                        <th key={col} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {saved.map((kw, i) => {
                      const intent = intentColors[kw.intent ?? ""] ?? null;
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                          <td style={{ padding: "11px 16px", fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{kw.keyword}</td>
                          <td style={{ padding: "11px 16px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{volFormat(kw.volume)}</td>
                          <td style={{ padding: "11px 16px", fontSize: 14, fontWeight: 800, color: diffColor(kw.difficulty) }}>{kw.difficulty ?? "—"}</td>
                          <td style={{ padding: "11px 16px", fontSize: 13, color: "#374151" }}>{kw.cpc !== null ? `$${kw.cpc.toFixed(2)}` : "—"}</td>
                          <td style={{ padding: "11px 16px" }}>
                            {intent ? <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: intent.bg, color: intent.color }}>{intent.label}</span> : "—"}
                          </td>
                          <td style={{ padding: "11px 16px", fontSize: 12, color: "#64748b" }}>{kw.source}</td>
                          <td style={{ padding: "11px 16px", fontSize: 12, color: "#94a3b8" }}>
                            {new Date(kw.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
