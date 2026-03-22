import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProductKeywordsClient from "@/components/dashboard/ProductKeywordsClient";

export default async function ProductKeywordsPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;

  const member = await prisma.tenantMember.findFirst({
    where: { userId },
    include: { tenant: { include: { projects: { take: 1 } } } },
  });

  const project = member?.tenant?.projects?.[0] ?? null;

  if (!project) {
    return (
      <div style={{ padding: "32px 36px" }}>
        <div style={{ background: "#ffffff", border: "2px dashed #e2e8f0", borderRadius: 16, padding: "56px 36px", textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🛒</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>No project selected</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 22 }}>
            Create a project first, then run product keyword discovery.
          </p>
          <Link href="/dashboard/projects" style={{ textDecoration: "none", background: "#1a56db", color: "#fff", padding: "10px 18px", borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
            Create Project
          </Link>
        </div>
      </div>
    );
  }

  return <ProductKeywordsClient projectId={project.id} />;
}
