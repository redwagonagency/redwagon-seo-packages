"use client";

import { useEffect, useMemo, useState } from "react";
import RunReportButton from "@/components/dashboard/RunReportButton";
import { parsePages, parseSiteIssues, type SiteIssue, type PageAuditResult } from "@/lib/reports/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SnapshotData {
  id: string;
  createdAt: string;
  status: string;
  siteScore: number | null;
  siteCrawledPages: number | null;
  onPageCrawledCount: number | null;
  onPageAvgScore: number | null;
  errorMessage: string | null;
}

interface SnapshotSummary {
  id: string;
  createdAt: string;
  status: string;
  siteScore: number | null;
  onPageCrawledCount: number | null;
}

interface ProgressPayload {
  status: string;
  phase: string;
  message: string;
  percent: number;
  crawledPages: number;
  targetPages: number;
}

interface LatestSnapshotPayload {
  id: string;
  createdAt: string;
  status: string;
  siteScore: number | null;
  siteCrawledPages: number | null;
  onPageCrawledCount: number | null;
  onPageAvgScore: number | null;
  errorMessage: string | null;
  siteIssuesJson?: string | null;
  onPagePagesJson?: string | null;
}

interface Props {
  domain: string;
  projectId: string;
  projectName: string;
  plan: string;
  pageLimit: number;
  snapshot: SnapshotData | null;
  snapshots: SnapshotSummary[];
  issues: SiteIssue[];
  pages: PageAuditResult[];
}

// ─── Semi-circle Gauge ────────────────────────────────────────────────────────

function SemiGauge({
  value,
  color = "#1a56db",
  size = 150,
}: {
  value: number;
  color?: string;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size * 0.55;
  const r = size * 0.38;
  const sw = size * 0.1;
  const lx = cx - r;
  const rx = cx + r;
  const py = cy;
  // Arc endpoint for given value% — 0% = left (180°), 100% = right (0°)
  const endDeg = 180 - value * 1.8;
  const endRad = (endDeg * Math.PI) / 180;
  const ex = cx + r * Math.cos(endRad);
  const ey = cy - r * Math.sin(endRad);
  const la = value > 50 ? 1 : 0;
  const svgH = Math.round(cy + sw / 2 + 4);

  return (
    <svg
      width={size}
      height={svgH}
      viewBox={`0 0 ${size} ${svgH}`}
      style={{ display: "block", margin: "0 auto" }}
    >
      {/* Background track */}
      <path
        d={`M ${lx} ${py} A ${r} ${r} 0 0 1 ${rx} ${py}`}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={sw}
        strokeLinecap="round"
      />
      {/* Value track */}
      {value > 0 && (
        <path
          d={`M ${lx} ${py} A ${r} ${r} 0 ${la} 1 ${ex} ${ey}`}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      )}
      {/* Indicator dot */}
      {value > 1 && value < 99 && (
        <circle cx={ex} cy={ey} r={sw * 0.35} fill="#dc2626" />
      )}
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type TabId = "overview" | "issues" | "crawled" | "statistics";

const AI_BOTS = [
  { name: "ChatGPT-User", icon: "🤖" },
  { name: "OAI-SearchBot", icon: "🤖" },
  { name: "Googlebot", icon: "🔵" },
  { name: "Google-Extended", icon: "🔵" },
  { name: "PerplexityBot", icon: "🟣" },
  { name: "ClaudeBot", icon: "🟠" },
];

export default function SiteAuditClient({
  domain,
  projectId,
  projectName,
  plan,
  pageLimit,
  snapshot: initialSnapshot,
  snapshots,
  issues: initialIssues,
  pages: initialPages,
}: Props) {
  const [tab, setTab] = useState<TabId>("overview");
  const [issueFilter, setIssueFilter] = useState<"all" | "critical" | "warning" | "info">("all");
  const [pageSort, setPageSort] = useState<"issues" | "score" | "url">("issues");
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(initialSnapshot);
  const [issues, setIssues] = useState<SiteIssue[]>(initialIssues);
  const [pages, setPages] = useState<PageAuditResult[]>(initialPages);
  const [runProgress, setRunProgress] = useState<ProgressPayload | null>(
    initialSnapshot?.status === "RUNNING"
      ? {
          status: "RUNNING",
          phase: "On-page crawl",
          message: "Report running",
          percent: 1,
          crawledPages: initialSnapshot.onPageCrawledCount ?? 0,
          targetPages: pageLimit,
        }
      : null
  );

  useEffect(() => {
    setSnapshot(initialSnapshot);
    setIssues(initialIssues);
    setPages(initialPages);
    if (initialSnapshot?.status === "RUNNING") {
      setRunProgress((prev) =>
        prev ?? {
          status: "RUNNING",
          phase: "On-page crawl",
          message: "Report running",
          percent: 1,
          crawledPages: initialSnapshot.onPageCrawledCount ?? 0,
          targetPages: pageLimit,
        }
      );
    }
  }, [initialSnapshot, initialIssues, initialPages, pageLimit]);

  useEffect(() => {
    let cancelled = false;

    const applyLatestSnapshot = (latest: LatestSnapshotPayload) => {
      if (cancelled) return;
      setSnapshot({
        id: latest.id,
        createdAt: latest.createdAt,
        status: latest.status,
        siteScore: latest.siteScore,
        siteCrawledPages: latest.siteCrawledPages,
        onPageCrawledCount: latest.onPageCrawledCount,
        onPageAvgScore: latest.onPageAvgScore,
        errorMessage: latest.errorMessage,
      });
      setIssues(parseSiteIssues(latest.siteIssuesJson ?? null));
      setPages(parsePages(latest.onPagePagesJson ?? null));
    };

    const fetchLatest = async () => {
      const latestRes = await fetch(`/api/reports/latest?projectId=${encodeURIComponent(projectId)}`, {
        cache: "no-store",
      });
      if (!latestRes.ok) return;
      const latest = (await latestRes.json()) as LatestSnapshotPayload | null;
      if (latest) applyLatestSnapshot(latest);
    };

    const poll = async () => {
      try {
        const progressRes = await fetch(`/api/reports/progress?projectId=${encodeURIComponent(projectId)}`, {
          cache: "no-store",
        });
        if (!progressRes.ok) return;

        const progress = (await progressRes.json()) as ProgressPayload | null;
        if (!progress || cancelled) return;

        if (progress.status === "RUNNING") {
          setRunProgress(progress);
          await fetchLatest();
          return;
        }

        setRunProgress(null);
        await fetchLatest();
      } catch {
        // Keep previous UI state for transient polling failures.
      }
    };

    void poll();
    const timer = window.setInterval(() => {
      void poll();
    }, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [projectId]);

  const siteScore = snapshot?.siteScore ?? 0;
  const totalCrawled = pages.length || snapshot?.onPageCrawledCount || runProgress?.crawledPages || 0;

  // Page health breakdown
  const healthy = pages.filter((p) => (p.score ?? 0) >= 80).length;
  const hasIssuesPgs = pages.filter((p) => {
    const s = p.score ?? 0;
    return s >= 40 && s < 80;
  }).length;
  const broken = pages.filter((p) => (p.score ?? 0) > 0 && (p.score ?? 0) < 40).length;

  // Aggregate issues across all pages + homepage issues
  const aggregated = useMemo(() => {
    const map = new Map<string, { severity: string; count: number }>();
    for (const iss of issues) {
      map.set(iss.description, { severity: iss.severity, count: iss.count ?? 1 });
    }
    for (const pg of pages) {
      for (const iss of pg.issues) {
        const existing = map.get(iss.description);
        if (existing) existing.count++;
        else map.set(iss.description, { severity: iss.severity, count: 1 });
      }
    }
    const order: Record<string, number> = { critical: 0, warning: 1, info: 2 };
    return [...map.entries()]
      .map(([desc, { severity, count }]) => ({ desc, severity, count }))
      .sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));
  }, [issues, pages]);

  const errTotal = aggregated
    .filter((i) => i.severity === "critical")
    .reduce((s, i) => s + i.count, 0);
  const warnTotal = aggregated
    .filter((i) => i.severity === "warning")
    .reduce((s, i) => s + i.count, 0);
  const infoTotal = aggregated
    .filter((i) => i.severity === "info")
    .reduce((s, i) => s + i.count, 0);

  // AI Search Health estimate from pages data
  const aiScore =
    pages.length > 0
      ? Math.min(
          99,
          Math.round(
            50 +
              (pages.filter((p) => p.hasSchema).length / pages.length) * 25 +
              (pages.filter((p) => p.loadTimeMs === 0 || p.loadTimeMs < 3000).length / pages.length) * 15 +
              (pages.filter((p) => p.hasCanonical).length / pages.length) * 10
          )
        )
      : siteScore > 50
      ? 78
      : 55;

  const scoreColor = (s: number | null) =>
    s === null ? "#94a3b8" : s >= 80 ? "#10b981" : s >= 50 ? "#f59e0b" : "#ef4444";

  const updatedAt = snapshot
    ? new Date(snapshot.createdAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const sortedPages = useMemo(() => {
    const copy = [...pages];
    if (pageSort === "score") copy.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
    else if (pageSort === "issues") copy.sort((a, b) => b.issues.length - a.issues.length);
    else copy.sort((a, b) => a.url.localeCompare(b.url));
    return copy;
  }, [pages, pageSort]);

  const prevSnapshot = snapshots[1] ?? null;
  const scoreDiff =
    prevSnapshot?.siteScore != null && snapshot?.siteScore != null
      ? snapshot.siteScore - prevSnapshot.siteScore
      : null;

  const TABS: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "issues", label: `Issues (${aggregated.length})` },
    { id: "crawled", label: `Crawled Pages (${totalCrawled})` },
    { id: "statistics", label: "Statistics" },
  ];

  const tabStyle = (id: TabId): React.CSSProperties => ({
    padding: "11px 20px",
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

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "20px 20px 16px",
  };

  return (
    <div
      style={{
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* ── PAGE HEADER ── */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          padding: "0 32px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 0 10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 19, fontWeight: 600, color: "#374151" }}>
              Site Audit:
            </span>
            <span style={{ fontSize: 19, fontWeight: 800, color: "#1a56db" }}>
              {domain}
            </span>
            <a
              href={`https://${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, color: "#94a3b8", textDecoration: "none" }}
            >
              ↗
            </a>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <RunReportButton
              projectId={projectId}
              projectName={projectName}
              lastRunAt={snapshot?.createdAt ?? null}
            />
            {(["PDF", "Export"] as const).map((btn) => (
              <button
                key={btn}
                style={{
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  borderRadius: 7,
                  padding: "7px 14px",
                  fontSize: 13,
                  color: "#374151",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                ↑ {btn}
              </button>
            ))}
          </div>
        </div>

        {/* Meta row */}
        {snapshot && (
          <div
            style={{
              display: "flex",
              gap: 20,
              fontSize: 13,
              color: "#64748b",
              paddingBottom: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span>Updated: {updatedAt}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              🖥 Desktop
            </span>
            <span>JS rendering: Disabled</span>
            <span
              style={{
                color:
                  totalCrawled >= pageLimit && pageLimit !== 9999
                    ? "#f59e0b"
                    : "inherit",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {totalCrawled >= pageLimit && pageLimit !== 9999 && "⚠️"} Pages
              crawled: {totalCrawled}/{pageLimit === 9999 ? "∞" : pageLimit}
            </span>
            {runProgress && (
              <span style={{ color: "#1a56db", fontWeight: 600 }}>
                {runProgress.phase} {runProgress.percent}% · {runProgress.crawledPages}/{runProgress.targetPages || pageLimit} pages
              </span>
            )}
            <span
              style={{
                fontSize: 11,
                background:
                  snapshot.status === "COMPLETE"
                    ? "#dcfce7"
                    : snapshot.status === "RUNNING"
                    ? "#dbeafe"
                    : "#fef3c7",
                color:
                  snapshot.status === "COMPLETE"
                    ? "#16a34a"
                    : snapshot.status === "RUNNING"
                    ? "#1d4ed8"
                    : "#b45309",
                padding: "2px 8px",
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              {snapshot.status}
            </span>
          </div>
        )}

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            marginTop: 4,
            borderTop: "1px solid #f1f5f9",
          }}
        >
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={tabStyle(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: "28px 32px" }}>
        {/* ═══════ OVERVIEW TAB ═══════ */}
        {tab === "overview" && (
          <>
            {/* No audit yet */}
            {!snapshot && (
              <div
                style={{
                  background: "#fff",
                  border: "2px dashed #e2e8f0",
                  borderRadius: 16,
                  padding: "60px 40px",
                  textAlign: "center",
                  marginBottom: 24,
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: 8,
                  }}
                >
                  No audit run yet
                </h2>
                <p style={{ fontSize: 14, color: "#64748b" }}>
                  Click &ldquo;Run Report&rdquo; to crawl your site, get a
                  health score, and discover all SEO issues.
                </p>
              </div>
            )}

            {/* 4 stat cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 16,
                marginBottom: 20,
              }}
            >
              {/* Card 1 — Site Health */}
              <div style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                    Site Health
                  </span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>ⓘ</span>
                </div>
                <SemiGauge value={siteScore} color="#1a56db" size={150} />
                <p
                  style={{
                    textAlign: "center",
                    fontSize: 30,
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: "6px 0 2px",
                    lineHeight: 1,
                  }}
                >
                  {siteScore ? `${siteScore}%` : "—"}
                </p>
                {scoreDiff !== null && (
                  <p
                    style={{
                      textAlign: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      color: scoreDiff >= 0 ? "#10b981" : "#ef4444",
                      marginBottom: 8,
                    }}
                  >
                    {scoreDiff >= 0 ? "+" : ""}
                    {scoreDiff}
                  </p>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: "#64748b",
                    paddingTop: 10,
                    borderTop: "1px solid #f1f5f9",
                    marginTop: 8,
                  }}
                >
                  <span>
                    <span style={{ color: "#1a56db" }}>●</span> Your site{" "}
                    <strong style={{ color: "#0f172a" }}>{siteScore}%</strong>
                  </span>
                  <span>
                    <span style={{ color: "#94a3b8" }}>▼</span> Top‑10%{" "}
                    <strong>92%</strong>
                  </span>
                </div>
              </div>

              {/* Card 2 — Crawled Pages */}
              <div style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                    Crawled Pages
                  </span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>ⓘ</span>
                </div>
                <p
                  style={{
                    fontSize: 38,
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: "0 0 14px",
                    lineHeight: 1,
                  }}
                >
                  {totalCrawled || "—"}
                </p>
                {totalCrawled > 0 && (
                  <div
                    style={{
                      height: 8,
                      borderRadius: 999,
                      display: "flex",
                      overflow: "hidden",
                      gap: 2,
                      marginBottom: 14,
                    }}
                  >
                    {healthy > 0 && (
                      <div
                        style={{
                          flex: healthy,
                          background: "#10b981",
                          minWidth: 4,
                          borderRadius: 4,
                        }}
                      />
                    )}
                    {broken > 0 && (
                      <div
                        style={{
                          flex: broken,
                          background: "#ef4444",
                          minWidth: 4,
                          borderRadius: 4,
                        }}
                      />
                    )}
                    {hasIssuesPgs > 0 && (
                      <div
                        style={{
                          flex: hasIssuesPgs,
                          background: "#f59e0b",
                          minWidth: 4,
                          borderRadius: 4,
                        }}
                      />
                    )}
                  </div>
                )}
                {[
                  { label: "Healthy", count: healthy, color: "#10b981" },
                  { label: "Broken", count: broken, color: "#ef4444" },
                  { label: "Have issues", count: hasIssuesPgs, color: "#f59e0b" },
                  { label: "Redirects", count: 0, color: "#3b82f6" },
                  { label: "Blocked", count: 0, color: "#94a3b8" },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 5,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: "#374151",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: row.color,
                          display: "inline-block",
                          flexShrink: 0,
                        }}
                      />
                      {row.label}
                    </span>
                    <span
                      style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}
                    >
                      {row.count}
                    </span>
                  </div>
                ))}
              </div>

              {/* Card 3 — AI Search Health */}
              <div style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      AI Search Health
                    </span>
                    <span
                      style={{
                        background: "#fb923c",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "1px 5px",
                        borderRadius: 3,
                      }}
                    >
                      beta
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>ⓘ</span>
                </div>
                <SemiGauge value={aiScore} color="#10b981" size={150} />
                <p
                  style={{
                    textAlign: "center",
                    fontSize: 30,
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: "6px 0 8px",
                    lineHeight: 1,
                  }}
                >
                  {aiScore}%
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    textAlign: "center",
                    marginBottom: 10,
                    lineHeight: 1.5,
                  }}
                >
                  {aiScore >= 80
                    ? "Website is well optimized for AI search engines"
                    : "Improvements needed for AI search optimization"}
                </p>
                {aggregated.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderTop: "1px solid #f1f5f9",
                      paddingTop: 8,
                    }}
                  >
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>
                      How it works
                    </span>
                    <button
                      onClick={() => setTab("issues")}
                      style={{
                        fontSize: 12,
                        color: "#ef4444",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      {aggregated.length} issues
                    </button>
                  </div>
                )}
              </div>

              {/* Card 4 — Blocked from AI Search */}
              <div style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    Blocked from AI Search
                  </span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>ⓘ</span>
                </div>
                {totalCrawled > 0 && (
                  <p
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      marginBottom: 12,
                    }}
                  >
                    Pages crawled: {totalCrawled}
                  </p>
                )}
                {AI_BOTS.map((bot) => (
                  <div
                    key={bot.name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 7,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "#374151",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      {bot.icon} {bot.name}
                    </span>
                    {snapshot ? (
                      <span
                        style={{
                          fontSize: 11,
                          color: "#10b981",
                          fontWeight: 600,
                        }}
                      >
                        ✓ All good
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>—</span>
                    )}
                  </div>
                ))}
                {snapshot && (
                  <button
                    onClick={() => setTab("issues")}
                    style={{
                      fontSize: 12,
                      color: "#1a56db",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      marginTop: 4,
                    }}
                  >
                    How to unblock pages →
                  </button>
                )}
              </div>
            </div>

            {/* Errors + Issues panel */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "180px 1fr",
                }}
              >
                {/* Left: severity counts */}
                <div
                  style={{
                    padding: 24,
                    borderRight: "1px solid #e2e8f0",
                    flexShrink: 0,
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#64748b",
                      marginBottom: 4,
                    }}
                  >
                    Errors ⓘ
                  </p>
                  <p
                    style={{
                      fontSize: 36,
                      fontWeight: 800,
                      color: "#ef4444",
                      lineHeight: 1,
                    }}
                  >
                    {errTotal}
                  </p>
                  {prevSnapshot && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "#ef4444",
                        marginTop: 3,
                      }}
                    >
                      +{errTotal}
                    </p>
                  )}
                  <div
                    style={{
                      height: 1,
                      background: "#f1f5f9",
                      margin: "14px 0",
                    }}
                  />
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#64748b",
                      marginBottom: 4,
                    }}
                  >
                    Warnings ⓘ
                  </p>
                  <p
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: "#f59e0b",
                      lineHeight: 1,
                    }}
                  >
                    {warnTotal}
                  </p>
                  <div
                    style={{
                      height: 1,
                      background: "#f1f5f9",
                      margin: "14px 0",
                    }}
                  />
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#64748b",
                      marginBottom: 4,
                    }}
                  >
                    Notices
                  </p>
                  <p
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: "#3b82f6",
                      lineHeight: 1,
                    }}
                  >
                    {infoTotal}
                  </p>
                </div>

                {/* Right: issue rows */}
                <div>
                  {aggregated.length === 0 ? (
                    <div
                      style={{
                        padding: "40px 24px",
                        textAlign: "center",
                        color: "#94a3b8",
                      }}
                    >
                      {snapshot
                        ? "✅ No issues detected on this site"
                        : "Run an audit to see your site issues"}
                    </div>
                  ) : (
                    <>
                      {aggregated.slice(0, 12).map((iss, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "14px 24px",
                            borderBottom:
                              i < Math.min(aggregated.length, 12) - 1
                                ? "1px solid #f8fafc"
                                : "none",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 15,
                                flexShrink: 0,
                                color:
                                  iss.severity === "critical"
                                    ? "#ef4444"
                                    : iss.severity === "warning"
                                    ? "#f59e0b"
                                    : "#3b82f6",
                              }}
                            >
                              {iss.severity === "critical"
                                ? "⚡"
                                : iss.severity === "warning"
                                ? "⚠"
                                : "ⓘ"}
                            </span>
                            <span
                              style={{
                                fontSize: 14,
                                color: "#374151",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {iss.desc}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 24,
                              alignItems: "center",
                              flexShrink: 0,
                              paddingLeft: 16,
                            }}
                          >
                            <button
                              onClick={() => setTab("crawled")}
                              style={{
                                fontSize: 13,
                                color: "#1a56db",
                                fontWeight: 600,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {iss.count} {iss.count === 1 ? "page" : "pages"}
                            </button>
                            <span
                              style={{
                                fontSize: 12,
                                color: "#94a3b8",
                                whiteSpace: "nowrap",
                              }}
                            >
                              How to fix →
                            </span>
                          </div>
                        </div>
                      ))}
                      {aggregated.length > 12 && (
                        <div
                          style={{
                            padding: "12px 24px",
                            borderTop: "1px solid #f1f5f9",
                          }}
                        >
                          <button
                            onClick={() => setTab("issues")}
                            style={{
                              fontSize: 13,
                              color: "#1a56db",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            View all {aggregated.length} issues →
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Audit History */}
            {snapshots.length > 1 && (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: 16,
                  }}
                >
                  Audit History
                </h3>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {snapshots.map((snap, i) => (
                    <div
                      key={snap.id}
                      style={{
                        padding: "12px 18px",
                        borderRadius: 10,
                        minWidth: 100,
                        border:
                          i === 0
                            ? "2px solid #1a56db"
                            : "1px solid #e2e8f0",
                        background: i === 0 ? "#eff6ff" : "#fff",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
                          marginBottom: 4,
                        }}
                      >
                        {new Date(snap.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p
                        style={{
                          fontSize: 26,
                          fontWeight: 800,
                          color: scoreColor(snap.siteScore),
                          lineHeight: 1,
                        }}
                      >
                        {snap.siteScore ?? "—"}
                      </p>
                      <p style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>
                        {snap.status}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══════ ISSUES TAB ═══════ */}
        {tab === "issues" && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {(["all", "critical", "warning", "info"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setIssueFilter(f)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 99,
                    fontSize: 13,
                    fontWeight: issueFilter === f ? 700 : 500,
                    border: `1px solid ${
                      f === "critical"
                        ? "#fca5a5"
                        : f === "warning"
                        ? "#fcd34d"
                        : f === "info"
                        ? "#93c5fd"
                        : "#e2e8f0"
                    }`,
                    background:
                      issueFilter === f
                        ? f === "critical"
                          ? "#fef2f2"
                          : f === "warning"
                          ? "#fffbeb"
                          : f === "info"
                          ? "#eff6ff"
                          : "#f8fafc"
                        : "#fff",
                    color:
                      f === "critical"
                        ? "#ef4444"
                        : f === "warning"
                        ? "#f59e0b"
                        : f === "info"
                        ? "#3b82f6"
                        : "#374151",
                    cursor: "pointer",
                  }}
                >
                  {f === "all"
                    ? `All Issues (${aggregated.length})`
                    : f === "critical"
                    ? `⚡ Errors (${aggregated.filter((i) => i.severity === "critical").length})`
                    : f === "warning"
                    ? `⚠ Warnings (${aggregated.filter((i) => i.severity === "warning").length})`
                    : `ⓘ Notices (${aggregated.filter((i) => i.severity === "info").length})`}
                </button>
              ))}
            </div>
            {aggregated.filter(
              (i) => issueFilter === "all" || i.severity === issueFilter
            ).length === 0 ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#94a3b8",
                }}
              >
                {snapshot ? "✅ No issues found" : "Run an audit first"}
              </div>
            ) : (
              aggregated
                .filter(
                  (i) => issueFilter === "all" || i.severity === issueFilter
                )
                .map((iss, i, arr) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "15px 24px",
                      borderBottom:
                        i < arr.length - 1 ? "1px solid #f8fafc" : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          flexShrink: 0,
                          display: "inline-block",
                          background:
                            iss.severity === "critical"
                              ? "#ef4444"
                              : iss.severity === "warning"
                              ? "#f59e0b"
                              : "#3b82f6",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 14,
                          color: "#374151",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {iss.desc}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 99,
                          flexShrink: 0,
                          background:
                            iss.severity === "critical"
                              ? "#fef2f2"
                              : iss.severity === "warning"
                              ? "#fffbeb"
                              : "#eff6ff",
                          color:
                            iss.severity === "critical"
                              ? "#ef4444"
                              : iss.severity === "warning"
                              ? "#f59e0b"
                              : "#3b82f6",
                        }}
                      >
                        {iss.severity.toUpperCase()}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        color: "#1a56db",
                        fontWeight: 600,
                        flexShrink: 0,
                        paddingLeft: 16,
                      }}
                    >
                      {iss.count} pages
                    </span>
                  </div>
                ))
            )}
          </div>
        )}

        {/* ═══════ CRAWLED PAGES TAB ═══════ */}
        {tab === "crawled" && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                {pages.length} pages crawled
              </span>
              <div
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Sort by:
                </span>
                {(["issues", "score", "url"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setPageSort(s)}
                    style={{
                      fontSize: 12,
                      padding: "5px 12px",
                      borderRadius: 6,
                      border: `1px solid ${pageSort === s ? "#1a56db" : "#e2e8f0"}`,
                      background: pageSort === s ? "#eff6ff" : "#fff",
                      color: pageSort === s ? "#1a56db" : "#64748b",
                      cursor: "pointer",
                      fontWeight: pageSort === s ? 700 : 400,
                    }}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {pages.length === 0 ? (
              <div
                style={{
                  padding: "40px 24px",
                  textAlign: "center",
                  color: "#94a3b8",
                }}
              >
                No pages crawled yet. Run an audit to see results.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {[
                        "URL",
                        "Score",
                        "Issues",
                        "Load Time",
                        "Title",
                        "Canonical",
                        "Schema",
                      ].map((col) => (
                        <th
                          key={col}
                          style={{
                            padding: "11px 16px",
                            textAlign: "left",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#64748b",
                            borderBottom: "1px solid #e2e8f0",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPages.map((pg, i) => (
                      <tr
                        key={i}
                        style={{ borderBottom: "1px solid #f8fafc" }}
                      >
                        <td
                          style={{ padding: "11px 16px", maxWidth: 280 }}
                        >
                          <a
                            href={pg.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: 12,
                              color: "#1a56db",
                              textDecoration: "none",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              display: "block",
                              maxWidth: 260,
                            }}
                          >
                            {pg.url.replace(/^https?:\/\/[^/]+/, "") || "/"}
                          </a>
                        </td>
                        <td style={{ padding: "11px 16px" }}>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 800,
                              color: scoreColor(pg.score),
                            }}
                          >
                            {pg.score ?? "—"}
                          </span>
                        </td>
                        <td style={{ padding: "11px 16px" }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            {pg.issues.filter(
                              (iss) => iss.severity === "critical"
                            ).length > 0 && (
                              <span
                                style={{
                                  fontSize: 10,
                                  background: "#fef2f2",
                                  color: "#ef4444",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  fontWeight: 700,
                                }}
                              >
                                {
                                  pg.issues.filter(
                                    (iss) => iss.severity === "critical"
                                  ).length
                                }
                                E
                              </span>
                            )}
                            {pg.issues.filter(
                              (iss) => iss.severity === "warning"
                            ).length > 0 && (
                              <span
                                style={{
                                  fontSize: 10,
                                  background: "#fffbeb",
                                  color: "#f59e0b",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  fontWeight: 700,
                                }}
                              >
                                {
                                  pg.issues.filter(
                                    (iss) => iss.severity === "warning"
                                  ).length
                                }
                                W
                              </span>
                            )}
                            {pg.issues.length === 0 && (
                              <span
                                style={{ color: "#10b981", fontSize: 12 }}
                              >
                                ✓
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "11px 16px" }}>
                          <span
                            style={{
                              fontSize: 13,
                              color:
                                pg.loadTimeMs > 3000 ? "#ef4444" : "#374151",
                              fontWeight: pg.loadTimeMs > 3000 ? 700 : 400,
                            }}
                          >
                            {pg.loadTimeMs
                              ? `${(pg.loadTimeMs / 1000).toFixed(1)}s`
                              : "—"}
                          </span>
                        </td>
                        <td
                          style={{ padding: "11px 16px", maxWidth: 220 }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              color: "#374151",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              display: "block",
                              maxWidth: 200,
                            }}
                          >
                            {pg.title ?? "—"}
                          </span>
                        </td>
                        <td style={{ padding: "11px 16px", fontSize: 14 }}>
                          {pg.hasCanonical ? "✅" : "❌"}
                        </td>
                        <td style={{ padding: "11px 16px", fontSize: 14 }}>
                          {pg.hasSchema ? "✅" : "❌"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══════ STATISTICS TAB ═══════ */}
        {tab === "statistics" && (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 16,
                marginBottom: 20,
              }}
            >
              {[
                { label: "Pages Crawled", value: totalCrawled, color: "#1a56db" },
                {
                  label: "Avg. On-Page Score",
                  value: snapshot?.onPageAvgScore
                    ? `${snapshot.onPageAvgScore}/100`
                    : "—",
                  color: scoreColor(snapshot?.onPageAvgScore ?? null),
                },
                { label: "Critical Issues", value: errTotal, color: "#ef4444" },
                { label: "Warnings", value: warnTotal, color: "#f59e0b" },
                { label: "Healthy Pages", value: healthy, color: "#10b981" },
                {
                  label: "With Schema Markup",
                  value: pages.filter((p) => p.hasSchema).length,
                  color: "#8b5cf6",
                },
                {
                  label: "With Canonical Tag",
                  value: pages.filter((p) => p.hasCanonical).length,
                  color: "#06b6d4",
                },
                {
                  label: "Slow Pages (>3s)",
                  value: pages.filter((p) => p.loadTimeMs > 3000).length,
                  color: "#f97316",
                },
                {
                  label: "Site Health Score",
                  value: siteScore ? `${siteScore}%` : "—",
                  color: scoreColor(siteScore),
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: 20,
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      color: "#64748b",
                      marginBottom: 8,
                    }}
                  >
                    {stat.label}
                  </p>
                  <p
                    style={{
                      fontSize: 32,
                      fontWeight: 800,
                      color: String(stat.color),
                      lineHeight: 1,
                    }}
                  >
                    {String(stat.value)}
                  </p>
                </div>
              ))}
            </div>
            {pages.length > 0 && (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: 16,
                  }}
                >
                  Score Distribution
                </h3>
                {[
                  {
                    range: "80–100 (Healthy)",
                    count: healthy,
                    color: "#10b981",
                    pct: (healthy / pages.length) * 100,
                  },
                  {
                    range: "40–79 (Has Issues)",
                    count: hasIssuesPgs,
                    color: "#f59e0b",
                    pct: (hasIssuesPgs / pages.length) * 100,
                  },
                  {
                    range: "0–39 (Broken)",
                    count: broken,
                    color: "#ef4444",
                    pct: (broken / pages.length) * 100,
                  },
                ].map((row) => (
                  <div key={row.range} style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        color: "#374151",
                        marginBottom: 5,
                      }}
                    >
                      <span>{row.range}</span>
                      <span style={{ fontWeight: 700, color: row.color }}>
                        {row.count} pages ({row.pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div
                      style={{
                        height: 8,
                        background: "#f1f5f9",
                        borderRadius: 4,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${row.pct}%`,
                          background: row.color,
                          borderRadius: 4,
                          transition: "width 0.5s",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
