"use client";

import { useState } from "react";
import type { PageAuditResult } from "@/lib/reports/types";

interface Props {
  pages: PageAuditResult[];
  projectId: string;
  plan: string;
}

type SortKey = "score" | "url" | "issues" | "loadTime";

export default function OnPageAnalyzer({ pages, projectId, plan }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortAsc, setSortAsc] = useState(false);
  const [filter, setFilter] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<Map<string, PageAuditResult>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const scoreColor = (s: number) =>
    s >= 70 ? "#10b981" : s >= 40 ? "#f59e0b" : "#ef4444";

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.url)));
  };

  const toggleOne = (url: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });

  const setSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(true); }
  };

  const filtered = pages
    .filter((p) => !filter || p.url.toLowerCase().includes(filter.toLowerCase()) || (p.title ?? "").toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      let diff = 0;
      if (sortKey === "score") diff = (results.get(a.url)?.score ?? a.score) - (results.get(b.url)?.score ?? b.score);
      else if (sortKey === "url") diff = a.url.localeCompare(b.url);
      else if (sortKey === "issues") diff = (results.get(a.url)?.issues.length ?? a.issues.length) - (results.get(b.url)?.issues.length ?? b.issues.length);
      else if (sortKey === "loadTime") diff = (results.get(a.url)?.loadTimeMs ?? a.loadTimeMs) - (results.get(b.url)?.loadTimeMs ?? b.loadTimeMs);
      return sortAsc ? diff : -diff;
    });

  async function handleAnalyze() {
    if (selected.size === 0) return;
    if (selected.size > 50) { setError("Select up to 50 pages at a time"); return; }
    setAnalyzing(true);
    setError(null);
    const res = await fetch("/api/reports/analyze-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, urls: Array.from(selected) }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Analysis failed"); setAnalyzing(false); return; }
    const newMap = new Map(results);
    for (const r of (data.results as PageAuditResult[])) newMap.set(r.url, r);
    setResults(newMap);
    setAnalyzing(false);
  }

  const SortArrow = ({ k }: { k: SortKey }) =>
    sortKey === k ? <span style={{ fontSize: 10, marginLeft: 4 }}>{sortAsc ? "▲" : "▼"}</span> : null;

  const thStyle: React.CSSProperties = {
    padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b",
    textAlign: "left", borderBottom: "1px solid #e2e8f0", cursor: "pointer",
    background: "#f8fafc", whiteSpace: "nowrap",
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Filter by URL or title…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "9px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, outline: "none" }}
        />
        <span style={{ fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}>
          {selected.size} selected
        </span>
        <button
          onClick={handleAnalyze}
          disabled={analyzing || selected.size === 0}
          style={{
            background: analyzing || selected.size === 0 ? "#93c5fd" : "#1a56db",
            color: "#fff", border: "none", padding: "9px 18px",
            borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: analyzing || selected.size === 0 ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {analyzing ? "Analyzing…" : `Run Analysis on ${selected.size || ""} Selected`}
        </button>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#dc2626" }}>
          {error}
        </div>
      )}

      {/* Plan note */}
      <div style={{ background: "rgba(26,86,219,0.04)", border: "1px solid rgba(26,86,219,0.15)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#1e40af" }}>
        <b>{plan} plan</b> — {pages.length} pages crawled from sitemap. Select pages and click &quot;Run Analysis&quot; to use DataForSEO on-page credits (up to 50 per run).
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 40 }}>
                <input
                  type="checkbox"
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  style={{ accentColor: "#1a56db" }}
                />
              </th>
              <th style={thStyle} onClick={() => setSort("url")}>
                URL <SortArrow k="url" />
              </th>
              <th style={thStyle} onClick={() => setSort("score")}>
                Score <SortArrow k="score" />
              </th>
              <th style={{ ...thStyle }} onClick={() => setSort("issues")}>
                Issues <SortArrow k="issues" />
              </th>
              <th style={{ ...thStyle }}>Title</th>
              <th style={thStyle} onClick={() => setSort("loadTime")}>
                Load ms <SortArrow k="loadTime" />
              </th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((page) => {
              const live = results.get(page.url);
              const display = live ?? page;
              const isSelected = selected.has(page.url);
              const refreshed = !!live;

              return (
                <tr
                  key={page.url}
                  style={{ borderBottom: "1px solid #f8fafc", background: isSelected ? "rgba(26,86,219,0.03)" : "transparent" }}
                  onClick={() => toggleOne(page.url)}
                >
                  <td style={{ padding: "10px 16px" }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(page.url)}
                      style={{ accentColor: "#1a56db" }}
                    />
                  </td>
                  <td style={{ padding: "10px 16px", maxWidth: 280 }}>
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: 12, color: "#1a56db", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {page.url.replace(/^https?:\/\//, "")}
                    </a>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: scoreColor(display.score) }}>
                      {display.score}
                    </span>
                    {refreshed && <span style={{ fontSize: 10, color: "#10b981", marginLeft: 4 }}>↺</span>}
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 13, color: display.issues.length > 0 ? "#ef4444" : "#10b981" }}>
                    {display.issues.length > 0 ? `${display.issues.length} issue${display.issues.length !== 1 ? "s" : ""}` : "Clean"}
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 12, color: "#64748b", maxWidth: 180 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                      {display.title ?? "—"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 12, color: display.loadTimeMs > 4000 ? "#f59e0b" : "#64748b" }}>
                    {display.loadTimeMs > 0 ? display.loadTimeMs.toLocaleString() : "—"}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 12,
                      background: display.responseCode >= 400 ? "#fef2f2" : "#f0fdf4",
                      color: display.responseCode >= 400 ? "#ef4444" : "#10b981",
                    }}>
                      {display.responseCode || "200"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: "40px 24px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
            No pages match your filter
          </div>
        )}
      </div>
      <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 10 }}>
        {pages.length} pages total · {results.size} re-analyzed this session
      </p>
    </div>
  );
}
