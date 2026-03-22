import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import RunReportButton from "@/components/dashboard/RunReportButton";

export default async function DomainAnalyticsPage() {
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
              domainAnalyses: { orderBy: { analyzedAt: "desc" }, take: 1 },
            },
          },
        },
      },
    },
  });

  const project = member?.tenant?.projects?.[0] ?? null;
  const snapshot = project?.reportSnapshots?.[0] ?? null;
  const analysis = project?.domainAnalyses?.[0] ?? null;

  let topKeywords: Array<{ keyword: string; position: number; traffic: number }> = [];
  let competitors: Array<{ domain: string; intersections: number; rank: number }> = [];

  if (analysis?.topKeywordsJson) {
    try {
      topKeywords = JSON.parse(analysis.topKeywordsJson) as Array<{ keyword: string; position: number; traffic: number }>;
    } catch {
      topKeywords = [];
    }
  }

  if (analysis?.competitorsJson) {
    try {
      competitors = JSON.parse(analysis.competitorsJson) as Array<{ domain: string; intersections: number; rank: number }>;
    } catch {
      competitors = [];
    }
  }

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Domain Analytics</h1>
          <p style={{ fontSize: 15, color: "#64748b" }}>Organic footprint, top keywords, and domain competitors</p>
        </div>
        {project && (
          <RunReportButton projectId={project.id} projectName={project.name} lastRunAt={snapshot?.createdAt?.toString() ?? null} />
        )}
      </div>

      {!project ? (
        <div style={{ background: "#fff", border: "2px dashed #e2e8f0", borderRadius: 16, padding: "60px 40px", textAlign: "center" }}>
          <p style={{ marginBottom: 18, color: "#64748b" }}>Create a project to run domain analytics.</p>
          <Link href="/dashboard/projects" style={{ background: "#1a56db", color: "#fff", padding: "10px 16px", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>Create Project</Link>
        </div>
      ) : !analysis ? (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24, color: "#64748b" }}>
          No domain analytics data yet. Run a report to fetch live domain metrics.
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 24 }}>
            {[
              { label: "Organic Keywords", value: analysis.organicKeywords?.toLocaleString() ?? "—", color: "#1a56db" },
              { label: "Estimated Traffic", value: analysis.organicTraffic?.toLocaleString() ?? "—", color: "#0891b2" },
              { label: "Domain Rank", value: analysis.domainRank?.toString() ?? "—", color: "#10b981" },
              { label: "Traffic Value", value: analysis.etv !== null ? `$${analysis.etv?.toLocaleString()}` : "—", color: "#7c3aed" },
            ].map((card) => (
              <div key={card.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px" }}>
                <p style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{card.label}</p>
                <p style={{ fontSize: 26, color: card.color, fontWeight: 800 }}>{card.value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, color: "#0f172a" }}>Top Organic Keywords</div>
              {topKeywords.length === 0 ? (
                <div style={{ padding: 16, color: "#94a3b8", fontSize: 13 }}>No keyword data available.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Keyword", "Pos", "Traffic"].map((h) => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topKeywords.slice(0, 20).map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: "#0f172a" }}>{row.keyword}</td>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151" }}>#{row.position}</td>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151" }}>{row.traffic?.toLocaleString() ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, color: "#0f172a" }}>SERP Competitors</div>
              {competitors.length === 0 ? (
                <div style={{ padding: 16, color: "#94a3b8", fontSize: 13 }}>No competitor data available.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Domain", "Overlap", "Avg Pos"].map((h) => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {competitors.slice(0, 20).map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: "#0f172a" }}>{row.domain}</td>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151" }}>{row.intersections}</td>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151" }}>{row.rank}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
