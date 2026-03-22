import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import RunReportButton from "@/components/dashboard/RunReportButton";
import { parseCompetitors, parseSiteIssues, type CompetitorResult } from "@/lib/reports/types";

export default async function CompetitorsPage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const member = await prisma.tenantMember.findFirst({
    where: { userId },
    include: {
      tenant: {
        include: {
          projects: {
            include: {
              reportSnapshots: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  const projects = member?.tenant?.projects ?? [];
  const project = projects[0] ?? null;
  const snapshot = project?.reportSnapshots?.[0] ?? null;

  const competitors: CompetitorResult[] = parseCompetitors(snapshot?.competitorJson ?? null);

  // Your own site's homepage score for comparison
  const yourScore = snapshot?.siteScore ?? null;
  const yourIssues = parseSiteIssues(snapshot?.siteIssuesJson ?? null);

  const scoreColor = (score: number | null) => {
    if (score === null) return "#94a3b8";
    if (score >= 70) return "#10b981";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  // Parse competitors from the project itself (even without a report)
  let savedCompetitors: string[] = [];
  if (project?.competitorsJson) {
    try { savedCompetitors = JSON.parse(project.competitorsJson); } catch { /* ignore */ }
  }

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Competitor Research</h1>
          <p style={{ fontSize: 15, color: "#64748b" }}>Side-by-side SEO analysis powered by DataForSEO</p>
        </div>
        {project && (
          <RunReportButton projectId={project.id} projectName={project.name} lastRunAt={snapshot?.createdAt?.toString() ?? null} />
        )}
      </div>

      {projects.length === 0 ? (
        <div style={{ background: "#fff", border: "2px dashed #e2e8f0", borderRadius: 16, padding: "60px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>No projects yet</h2>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Create a project and add competitor domains to get started.</p>
          <Link href="/dashboard/projects" style={{ background: "#1a56db", color: "#fff", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Create Project
          </Link>
        </div>
      ) : savedCompetitors.length === 0 ? (
        <div style={{ background: "#fff", border: "2px dashed #e2e8f0", borderRadius: 16, padding: "60px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>No competitors configured</h2>
          <p style={{ fontSize: 14, color: "#64748b", maxWidth: 440, margin: "0 auto 24px", lineHeight: 1.6 }}>
            Edit your project to add up to 5 competitor domains. We&apos;ll analyse their SEO health every time you run a report.
          </p>
          <Link href="/dashboard/projects" style={{ background: "#1a56db", color: "#fff", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Edit Project
          </Link>
        </div>
      ) : (
        <>
          {/* Your site vs competitors — score overview */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(savedCompetitors.length + 1, 4)}, 1fr)`, gap: 20, marginBottom: 32 }}>
            {/* Your site card */}
            <div style={{ background: "linear-gradient(135deg,#1a56db08,#06b6d408)", border: "2px solid #1a56db40", borderRadius: 14, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1a56db" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1a56db" }}>YOUR SITE</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{project?.domain ?? "—"}</p>
              <div style={{ fontSize: 40, fontWeight: 800, color: scoreColor(yourScore), marginBottom: 8 }}>
                {yourScore ?? "—"}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>SEO Score /100</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                <span style={{ color: "#ef4444", fontWeight: 700 }}>{yourIssues.filter((i) => i.severity === "critical").length}</span> critical &bull;{" "}
                <span style={{ color: "#f59e0b", fontWeight: 700 }}>{yourIssues.filter((i) => i.severity === "warning").length}</span> warnings
              </div>
              {!snapshot && <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>Run a report to see your score</p>}
            </div>

            {/* Competitor cards */}
            {savedCompetitors.slice(0, 3).map((cd) => {
              const data = competitors.find((c) => c.domain === cd);
              return (
                <div key={cd} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#94a3b8" }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>COMPETITOR</span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{cd}</p>
                  {data ? (
                    <>
                      <div style={{ fontSize: 40, fontWeight: 800, color: scoreColor(data.score), marginBottom: 8 }}>
                        {data.score}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>SEO Score /100</div>
                      {data.error ? (
                        <p style={{ fontSize: 11, color: "#ef4444" }}>{data.error}</p>
                      ) : (
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          <span style={{ color: "#ef4444", fontWeight: 700 }}>{data.issues.filter((i) => i.severity === "critical").length}</span> critical &bull;{" "}
                          <span style={{ color: "#f59e0b", fontWeight: 700 }}>{data.issues.filter((i) => i.severity === "warning").length}</span> warnings
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: 40, fontWeight: 800, color: "#e2e8f0", marginBottom: 8 }}>—</div>
                  )}
                  {!snapshot && <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>Run a report to analyse</p>}
                </div>
              );
            })}
          </div>

          {/* Detailed comparison table */}
          {competitors.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", marginBottom: 28 }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Head-to-Head Comparison</h3>
                <p style={{ fontSize: 13, color: "#64748b" }}>Technical SEO metrics compared across your site and competitors</p>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ padding: "12px 20px", textAlign: "left" as const, fontSize: 12, fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>Metric</th>
                      <th style={{ padding: "12px 20px", textAlign: "center" as const, fontSize: 12, fontWeight: 700, color: "#1a56db", borderBottom: "1px solid #e2e8f0", background: "#eff6ff" }}>
                        {project?.domain ?? "Your Site"}
                      </th>
                      {competitors.map((c) => (
                        <th key={c.domain} style={{ padding: "12px 20px", textAlign: "center" as const, fontSize: 12, fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
                          {c.domain}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        label: "SEO Score",
                        yours: yourScore !== null ? `${yourScore}/100` : "—",
                        comp: (c: CompetitorResult) => `${c.score}/100`,
                        yoursColor: scoreColor(yourScore),
                        compColor: (c: CompetitorResult) => scoreColor(c.score),
                      },
                      {
                        label: "Load Time",
                        yours: snapshot ? (((snapshot as Record<string, unknown>).siteLoadTimeMs as number) ? `${(((snapshot as Record<string, unknown>).siteLoadTimeMs as number) / 1000).toFixed(1)}s` : "—") : "—",
                        comp: (c: CompetitorResult) => c.loadTimeMs ? `${(c.loadTimeMs / 1000).toFixed(1)}s` : "—",
                        yoursColor: "#374151",
                        compColor: () => "#374151",
                      },
                      {
                        label: "Has Canonical",
                        yours: snapshot?.siteIssuesJson ? (yourIssues.some((i) => i.type === "missing_canonical") ? "❌ No" : "✅ Yes") : "—",
                        comp: (c: CompetitorResult) => c.hasCanonical ? "✅ Yes" : "❌ No",
                        yoursColor: "#374151",
                        compColor: () => "#374151",
                      },
                      {
                        label: "Structured Data",
                        yours: snapshot?.siteIssuesJson ? (yourIssues.some((i) => i.type === "missing_schema") ? "❌ No" : "✅ Yes") : "—",
                        comp: (c: CompetitorResult) => c.hasSchema ? "✅ Yes" : "❌ No",
                        yoursColor: "#374151",
                        compColor: () => "#374151",
                      },
                      {
                        label: "Critical Issues",
                        yours: `${yourIssues.filter((i) => i.severity === "critical").length}`,
                        comp: (c: CompetitorResult) => `${c.issues.filter((i) => i.severity === "critical").length}`,
                        yoursColor: yourIssues.filter((i) => i.severity === "critical").length > 0 ? "#ef4444" : "#10b981",
                        compColor: (c: CompetitorResult) => c.issues.filter((i) => i.severity === "critical").length > 0 ? "#ef4444" : "#10b981",
                      },
                    ].map((row) => (
                      <tr key={row.label} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600, color: "#374151" }}>{row.label}</td>
                        <td style={{ padding: "14px 20px", textAlign: "center" as const, fontSize: 14, fontWeight: 700, color: row.yoursColor, background: "#eff6ff" }}>
                          {row.yours}
                        </td>
                        {competitors.map((c) => (
                          <td key={c.domain} style={{ padding: "14px 20px", textAlign: "center" as const, fontSize: 14, color: row.compColor(c) }}>
                            {row.comp(c)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Issues Breakdown per competitor */}
          {competitors.filter((c) => c.issues.length > 0).length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Competitor Issues</h3>
                <p style={{ fontSize: 13, color: "#64748b" }}>Issues found on competitor home pages — use these to identify opportunities</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(competitors.length, 3)}, 1fr)`, gap: 1, background: "#f1f5f9" }}>
                {competitors.map((c) => {
                  const severityColor: Record<string, string> = { critical: "#ef4444", warning: "#f59e0b", info: "#3b82f6" };
                  return (
                    <div key={c.domain} style={{ background: "#fff", padding: 20 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                        {c.domain}
                      </h4>
                      {c.error ? (
                        <p style={{ fontSize: 12, color: "#ef4444" }}>Could not analyse: {c.error}</p>
                      ) : c.issues.length === 0 ? (
                        <p style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>✅ No issues found</p>
                      ) : (
                        c.issues.map((issue, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: severityColor[issue.severity] ?? "#94a3b8", flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.4 }}>{issue.description}</span>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!snapshot && savedCompetitors.length > 0 && (
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: "28px 32px", textAlign: "center", marginTop: 24 }}>
              <p style={{ fontSize: 15, color: "#374151", marginBottom: 12 }}>
                Click <strong>Run Report</strong> above to fetch live competitor data from DataForSEO.
              </p>
              <p style={{ fontSize: 13, color: "#94a3b8" }}>
                Tracking: {savedCompetitors.join(", ")}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
