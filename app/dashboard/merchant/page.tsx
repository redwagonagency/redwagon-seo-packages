import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function MerchantRankingsPage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const member = await prisma.tenantMember.findFirst({
    where: { userId },
    include: {
      tenant: {
        include: {
          projects: true,
        },
      },
    },
  });

  const project = member?.tenant?.projects?.[0] ?? null;

  return (
    <div style={{ padding: "32px 36px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Merchant Rankings</h1>
      <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>Google Shopping placement tracking for ecommerce terms.</p>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, color: "#0f172a" }}>
          Latest Shopping Rankings
        </div>
        <div style={{ padding: 16, fontSize: 13, color: "#94a3b8" }}>
          Shopping ranking history is enabled in the data layer but not yet synced to this dashboard view in the current Prisma client build.
          {project ? " Run reports after the next schema sync to populate this table." : " Create a project first to enable merchant tracking."}
        </div>
      </div>
    </div>
  );
}
