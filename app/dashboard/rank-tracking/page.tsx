import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import RunReportButton from "@/components/dashboard/RunReportButton";
import KeywordsManager from "@/components/dashboard/KeywordsManager";
import { parseRankings } from "@/lib/reports/types";

const KEYWORD_LIMITS: Record<string, number> = {
  STARTER: 20, PRO: 100, ENTERPRISE: 250, AGENCY: 500, ADMIN: 9999,
};

export default async function RankTrackingPage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const member = await prisma.tenantMember.findFirst({
    where: { userId },
    include: {
      tenant: {
        include: {
          projects: {
            include: {
              reportSnapshots: { orderBy: { createdAt: "desc" }, take: 1 },
              rankTrackers: { orderBy: { createdAt: "asc" }, select: { id: true, keyword: true, device: true, location: true } },
            },
          },
        },
      },
    },
  });

  const plan = (member?.tenant as { plan?: string } | undefined)?.plan ?? "STARTER";
  const keywordLimit = KEYWORD_LIMITS[plan] ?? 20;
  const projects = member?.tenant?.projects ?? [];
  const project = projects[0] ?? null;
  const snapshot = project?.reportSnapshots?.[0] ?? null;
  const trackedKeywords = project?.rankTrackers ?? [];
  const rankings = parseRankings(snapshot?.rankingsJson ?? null);
  const ranked = rankings.filter(r => r.position !== null);

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Rank Tracking</h1>
          <p style={{ fontSize: 15, color: "#64748b" }}>Track keyword positions daily via DataForSEO SERP API</p>
        </div>
        {project && (
          <RunReportButton
            projectId={project.id}
            projectName={project.name}
            lastRunAt={snapshot?.createdAt?.toString() ?? null}
          />
        )}
      </div>

      {projects.length === 0 ? (
        <div style={{ background: "#ffffff", border: "2px dashed #e2e8f0", borderRadius: 16, padding: "60px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Start tracking keywords</h2>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Create a project and add keywords, then run a report to track positions.</p>
          <Link href="/dashboard/projects" style={{ background: "#0891b2", color: "#fff", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Create Project
          </Link>
        </div>
      ) : (
        <>
          {/* Keyword management */}
          {project && (
            <KeywordsManager
              projectId={project.id}
              keywords={trackedKeywords}
              keywordLimit={keywordLimit}
              plan={plan}
            />
          )}

          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 28 }}>
            {[
              { label: "Total Keywords", value: rankings.length || "—", color: "#0891b2" },
              { label: "Avg. Position", value: snapshot?.avgPosition ? snapshot.avgPosition.toFixed(1) : "—", color: "#1a56db" },
              { label: "Top 3", value: snapshot?.top3Count ?? "—", color: "#10b981" },
              { label: "Top 10", value: snapshot?.top10Count ?? "—", color: "#7c3aed" },
            ].map(s => (
              <div key={s.label} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 22px" }}>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>{s.label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{String(s.value)}</p>
              </div>
            ))}
          </div>

          {/* Keywords table */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Keyword Rankings</h3>
              {snapshot && <span style={{ fontSize: 12, color: "#94a3b8" }}>Last updated: {new Date(snapshot.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
            </div>

            {rankings.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
                <p style={{ fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                  {snapshot ? "No keywords configured yet" : "Run a report to see rankings"}
                </p>
                <p style={{ fontSize: 13, color: "#94a3b8" }}>
                  {snapshot ? "Add keywords to your project first, then re-run the report." : "Click \"Run Report\" above."}
                </p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Keyword", "Position", "Change", "URL", "Device", "Location"].map(h => (
                      <th key={h} style={{ padding: "12px 20px", fontSize: 12, fontWeight: 600, color: "#64748b", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((r, i) => {
                    const change = r.prevPosition !== null && r.position !== null ? r.prevPosition - r.position : null;
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "14px 20px", fontSize: 14, color: "#0f172a", fontWeight: 500 }}>{r.keyword}</td>
                        <td style={{ padding: "14px 20px" }}>
                          {r.position !== null ? (
                            <span style={{ fontSize: 16, fontWeight: 800, color: r.position <= 3 ? "#10b981" : r.position <= 10 ? "#1a56db" : "#64748b" }}>
                              #{r.position}
                            </span>
                          ) : (
                            <span style={{ fontSize: 13, color: "#94a3b8" }}>Not ranking</span>
                          )}
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          {change !== null ? (
                            <span style={{ color: change > 0 ? "#10b981" : change < 0 ? "#ef4444" : "#94a3b8", fontWeight: 600, fontSize: 13 }}>
                              {change > 0 ? `▲ ${change}` : change < 0 ? `▼ ${Math.abs(change)}` : "—"}
                            </span>
                          ) : <span style={{ color: "#94a3b8", fontSize: 13 }}>New</span>}
                        </td>
                        <td style={{ padding: "14px 20px", fontSize: 12, color: "#64748b", maxWidth: 200 }}>
                          {r.url ? <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{r.url}</span> : "—"}
                        </td>
                        <td style={{ padding: "14px 20px", fontSize: 12, color: "#64748b" }}>{r.device}</td>
                        <td style={{ padding: "14px 20px", fontSize: 12, color: "#64748b" }}>{r.location}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {rankings.length > 0 && ranked.length === 0 && (
            <div style={{ marginTop: 16, padding: "12px 20px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10 }}>
              <p style={{ fontSize: 13, color: "#92400e" }}>⚠️ None of your keywords are ranking in the top 100. Consider targeting lower-competition variations.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
