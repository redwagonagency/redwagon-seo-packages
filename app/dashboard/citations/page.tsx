import { auth } from "@/lib/auth";
import { isPrismaMissingTableError, prisma } from "@/lib/prisma";
import Link from "next/link";
import RunReportButton from "@/components/dashboard/RunReportButton";

export default async function CitationsPage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  let member: any = null;
  try {
    member = await prisma.tenantMember.findFirst({
      where: { userId },
      include: {
        tenant: {
          include: {
            projects: {
              include: {
                reportSnapshots: { orderBy: { createdAt: "desc" }, take: 1 },
                localCitations: { orderBy: { updatedAt: "desc" }, take: 500 },
              },
            },
          },
        },
      },
    });
  } catch (error) {
    if (isPrismaMissingTableError(error, "LocalCitation")) {
      member = await prisma.tenantMember.findFirst({
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
    } else {
      throw error;
    }
  }

  const project = member?.tenant?.projects?.[0] ?? null;
  const snapshot = project?.reportSnapshots?.[0] ?? null;
  const citations = (project as { localCitations?: Array<{ id: string; directory: string; status: string; address: string | null; phone: string | null; website: string | null; naConsistent: boolean }> } | null)?.localCitations ?? [];

  const consistent = citations.filter((c) => c.naConsistent).length;
  const inconsistent = citations.filter((c) => !c.naConsistent && c.status !== "MISSING").length;
  const missing = citations.filter((c) => c.status === "MISSING").length;

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Citations / NAP Consistency</h1>
          <p style={{ fontSize: 15, color: "#64748b" }}>Track listing consistency across major local directories</p>
        </div>
        {project && (
          <RunReportButton projectId={project.id} projectName={project.name} lastRunAt={snapshot?.createdAt?.toString() ?? null} />
        )}
      </div>

      {!project ? (
        <div style={{ background: "#fff", border: "2px dashed #e2e8f0", borderRadius: 16, padding: "60px 40px", textAlign: "center" }}>
          <p style={{ marginBottom: 18, color: "#64748b" }}>Create a project to start citation tracking.</p>
          <Link href="/dashboard/projects" style={{ background: "#d97706", color: "#fff", padding: "10px 16px", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>Create Project</Link>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginBottom: 24 }}>
            {[
              { label: "Consistent Listings", value: consistent, color: "#16a34a" },
              { label: "Inconsistent Listings", value: inconsistent, color: "#b45309" },
              { label: "Missing Listings", value: missing, color: "#b91c1c" },
            ].map((card) => (
              <div key={card.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px" }}>
                <p style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{card.label}</p>
                <p style={{ fontSize: 28, color: card.color, fontWeight: 800 }}>{card.value}</p>
              </div>
            ))}
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, color: "#0f172a" }}>Directory Listings</div>
            {citations.length === 0 ? (
              <div style={{ padding: 16, color: "#94a3b8", fontSize: 13 }}>
                No citation data yet. Run a report to scan directory consistency.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Directory", "Status", "Address", "Phone", "Website"].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {citations.map((row) => {
                    const color = row.status === "CONSISTENT" ? "#166534" : row.status === "MISSING" ? "#991b1b" : "#92400e";
                    const bg = row.status === "CONSISTENT" ? "#dcfce7" : row.status === "MISSING" ? "#fee2e2" : "#ffedd5";
                    return (
                      <tr key={row.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: "#0f172a" }}>{row.directory}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color, background: bg, borderRadius: 99, padding: "3px 8px" }}>{row.status}</span>
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151" }}>{row.address ?? "—"}</td>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151" }}>{row.phone ?? "—"}</td>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.website ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
