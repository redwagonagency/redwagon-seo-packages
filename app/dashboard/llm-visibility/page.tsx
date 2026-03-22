import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import RunReportButton from "@/components/dashboard/RunReportButton";
import { parseLlmSnapshot } from "@/lib/reports/types";

export default async function LlmVisibilityPage() {
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
            },
          },
        },
      },
    },
  });

  const projects = member?.tenant?.projects ?? [];
  const project = projects[0] ?? null;
  const snapshot = project?.reportSnapshots?.[0] ?? null;
  const llm = parseLlmSnapshot(snapshot?.llmJson ?? null);
  const mentions = llm.mentions;
  const topPages = llm.topPages ?? [];
  const topDomains = llm.topDomains ?? [];
  const mentionRate = snapshot?.llmMentionRate ?? 0;

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>LLM Visibility</h1>
          <p style={{ fontSize: 15, color: "#64748b" }}>Track how often your brand appears in AI-generated answers</p>
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>No projects yet</h2>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Create a project first to track AI visibility.</p>
          <Link href="/dashboard/projects" style={{ background: "#059669", color: "#fff", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Create Project
          </Link>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginBottom: 28 }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "22px 24px" }}>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>Overall Mention Rate</p>
              <p style={{ fontSize: 36, fontWeight: 800, color: mentionRate > 50 ? "#10b981" : mentionRate > 0 ? "#f59e0b" : "#94a3b8" }}>{snapshot ? `${mentionRate}%` : "—"}</p>
            </div>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "22px 24px" }}>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>Queries Checked</p>
              <p style={{ fontSize: 36, fontWeight: 800, color: "#1a56db" }}>{mentions.length || "—"}</p>
            </div>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "22px 24px" }}>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>Mentions Found</p>
              <p style={{ fontSize: 36, fontWeight: 800, color: "#059669" }}>{mentions.filter(m => m.mentioned).length || "—"}</p>
            </div>
          </div>

          {/* How it works note */}
          <div style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 12, padding: "14px 20px", marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18 }}>ℹ️</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>How LLM Visibility is measured</p>
              <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
                We query Google Search for your brand name and related terms, then check if Google AI Overviews, Featured Snippets, or top organic results (top 3) mention your domain. 
                Each report run checks with live SerpAPI results.
              </p>
            </div>
          </div>

          {/* Mentions table */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Query Results</h3>
              {snapshot && <span style={{ fontSize: 12, color: "#94a3b8" }}>Checked: {new Date(snapshot.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>}
            </div>

            {mentions.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
                <p style={{ fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                  {snapshot ? "No LLM data collected" : "Run a report to check AI visibility"}
                </p>
                <p style={{ fontSize: 13, color: "#94a3b8" }}>Click &quot;Run Report&quot; above to check your brand visibility in AI answers.</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Query", "Source", "Mentioned", "Snippet"].map(h => (
                      <th key={h} style={{ padding: "12px 20px", fontSize: 12, fontWeight: 600, color: "#64748b", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mentions.map((m, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "14px 20px", fontSize: 14, color: "#0f172a", fontWeight: 500 }}>{m.query}</td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#64748b" }}>{m.source}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{
                          background: m.mentioned ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                          color: m.mentioned ? "#10b981" : "#ef4444",
                          padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700
                        }}>
                          {m.mentioned ? "✓ Yes" : "✗ No"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 12, color: "#64748b", maxWidth: 300 }}>
                        {m.snippet ? <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>{m.snippet}</span> : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Top LLM Pages</h3>
              </div>
              {topPages.length === 0 ? (
                <div style={{ padding: "18px 20px", fontSize: 13, color: "#94a3b8" }}>No page-level LLM mention data yet.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#64748b" }}>Page</th>
                      <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#64748b" }}>Mentions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPages.slice(0, 8).map((p, i) => (
                      <tr key={`${p.page}-${i}`} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: "#0f172a", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.page || "—"}</td>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: "#0f172a", fontWeight: 700 }}>{p.mentions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Top LLM Domains</h3>
              </div>
              {topDomains.length === 0 ? (
                <div style={{ padding: "18px 20px", fontSize: 13, color: "#94a3b8" }}>No domain-level LLM mention data yet.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#64748b" }}>Domain</th>
                      <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#64748b" }}>Mentions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDomains.slice(0, 8).map((d, i) => (
                      <tr key={`${d.domain}-${i}`} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: "#0f172a" }}>{d.domain || "—"}</td>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: "#0f172a", fontWeight: 700 }}>{d.mentions}</td>
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
