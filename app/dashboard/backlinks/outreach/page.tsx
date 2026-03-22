import { auth } from "@/lib/auth";
import { isPrismaMissingTableError, prisma } from "@/lib/prisma";

export default async function BacklinkOutreachPage() {
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
                backlinkOutreach: { orderBy: { updatedAt: "desc" }, take: 200 },
              },
            },
          },
        },
      },
    });
  } catch (error) {
    if (isPrismaMissingTableError(error, "BacklinkOutreach")) {
      member = await prisma.tenantMember.findFirst({
        where: { userId },
        include: {
          tenant: {
            include: {
              projects: true,
            },
          },
        },
      });
    } else {
      throw error;
    }
  }

  const project = member?.tenant?.projects?.[0] ?? null;
  const outreach = (project as { backlinkOutreach?: Array<{ id: string; domain: string; contactEmail: string | null; contactName: string | null; status: string; domainRank: number | null; updatedAt: Date }> } | null)?.backlinkOutreach ?? [];

  return (
    <div style={{ padding: "32px 36px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Link Building Outreach</h1>
      <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>Manage backlink prospects and relationship status.</p>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, color: "#0f172a" }}>
          Prospects ({outreach.length})
        </div>
        {outreach.length === 0 ? (
          <div style={{ padding: 16, fontSize: 13, color: "#94a3b8" }}>
            No outreach records yet. Add prospects after reviewing backlink opportunities.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Domain", "Contact", "Status", "DR", "Updated"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {outreach.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#0f172a" }}>{row.domain}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151" }}>{row.contactEmail ?? row.contactName ?? "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151" }}>{row.status}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151" }}>{row.domainRank ?? "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#64748b" }}>{new Date(row.updatedAt).toLocaleDateString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
