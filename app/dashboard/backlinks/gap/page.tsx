import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBacklinkGap, type BacklinkGapItem } from "@/lib/dataforseo/client";
import RunReportButton from "@/components/dashboard/RunReportButton";

function parseCompetitors(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => String(item ?? "").trim())
      .filter(Boolean)
      .map((domain) => domain.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].toLowerCase());
  } catch {
    return [];
  }
}

export default async function BacklinkGapPage() {
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

  const project = member?.tenant?.projects?.[0] ?? null;
  const snapshot = project?.reportSnapshots?.[0] ?? null;

  const competitorDomains = parseCompetitors(project?.competitorsJson ?? null).slice(0, 10);
  const yourDomain = (project?.domain ?? "")
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .toLowerCase();

  let gapRows: BacklinkGapItem[] = [];
  let gapError: string | null = null;

  if (project && yourDomain && competitorDomains.length > 0) {
    try {
      gapRows = await getBacklinkGap(yourDomain, competitorDomains, 200);
    } catch (error) {
      gapError = error instanceof Error ? error.message : "Unable to load backlink gap data";
    }
  }

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Backlink Gap</h1>
          <p style={{ fontSize: 15, color: "#64748b" }}>Domains linking to competitors but not your project</p>
        </div>
        {project && (
          <RunReportButton projectId={project.id} projectName={project.name} lastRunAt={snapshot?.createdAt?.toString() ?? null} />
        )}
      </div>

      {!project ? (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, color: "#64748b" }}>
          Create a project first to run backlink gap analysis.
        </div>
      ) : competitorDomains.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, color: "#64748b" }}>
          Add competitor domains in project settings to populate backlink gap opportunities.
        </div>
      ) : gapError ? (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 20, color: "#991b1b" }}>
          {gapError}
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>Your Domain</div>
              <div style={{ marginTop: 4, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{yourDomain}</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>Competitors Compared</div>
              <div style={{ marginTop: 4, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{competitorDomains.length}</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>Gap Opportunities</div>
              <div style={{ marginTop: 4, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{gapRows.length}</div>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, color: "#0f172a" }}>
              Domains to Target
            </div>
            {gapRows.length === 0 ? (
              <div style={{ padding: 16, color: "#94a3b8", fontSize: 13 }}>
                No backlink gap rows returned yet. Run another report after competitor crawl completes.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {[
                      "Linking Domain",
                      "Backlinks",
                      "Domain Rank",
                      "Sample URL",
                      "Anchor",
                    ].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gapRows.slice(0, 200).map((row, idx) => (
                    <tr key={`${row.domain}-${idx}`} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: "#0f172a", fontWeight: 600 }}>{row.domain}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151" }}>{row.backlinks.toLocaleString()}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151" }}>{row.domainRank}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.url ?? "—"}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.anchor ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
