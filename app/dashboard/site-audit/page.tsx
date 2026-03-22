import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { parseSiteIssues, parsePages } from "@/lib/reports/types";
import SiteAuditClient from "@/components/dashboard/SiteAuditClient";

export default async function SiteAuditPage() {
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
                take: 5,
              },
            },
          },
        },
      },
    },
  });

  const plan = (member?.tenant as { plan?: string } | undefined)?.plan ?? "STARTER";
  const pageLimits: Record<string, number> = {
    STARTER: 10, PRO: 50, ENTERPRISE: 100, AGENCY: 500, ADMIN: 9999,
  };
  const parsePositiveInt = (value: string | undefined, fallback: number) => {
    if (!value) return fallback;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };
  const globalMaxPages = parsePositiveInt(process.env.REPORT_GLOBAL_MAX_PAGES, 500);
  const coreAuditLimit = parsePositiveInt(process.env.REPORT_CORE_AUDIT_MAX_PAGES, 500);
  const projectDomain = (member?.tenant?.projects?.[0]?.domain ?? "")
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .toLowerCase();
  const planLimit = pageLimits[plan] ?? 10;
  const requestedPages = projectDomain === "redwagon.agency" ? Math.max(planLimit, coreAuditLimit) : planLimit;
  const pageLimit = Math.min(requestedPages, globalMaxPages);

  const projects = member?.tenant?.projects ?? [];
  const project = projects[0] ?? null;

  if (!project) {
    return (
      <div style={{ padding: "32px 36px" }}>
        <div style={{ background: "#fff", border: "2px dashed #e2e8f0", borderRadius: 16, padding: "60px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>No projects yet</h2>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Create a project to run your first site audit.</p>
          <Link href="/dashboard/projects" style={{ background: "#1a56db", color: "#fff", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Create Project
          </Link>
        </div>
      </div>
    );
  }

  const snapshot = project.reportSnapshots?.[0] ?? null;
  const snapshots = project.reportSnapshots ?? [];

  const issues = parseSiteIssues(snapshot?.siteIssuesJson ?? null);
  const pages = parsePages(snapshot?.onPagePagesJson ?? null);

  const snapshotData = snapshot
    ? {
        id: snapshot.id,
        createdAt: snapshot.createdAt.toISOString(),
        status: snapshot.status,
        siteScore: snapshot.siteScore,
        siteCrawledPages: snapshot.siteCrawledPages,
        onPageCrawledCount: snapshot.onPageCrawledCount,
        onPageAvgScore: snapshot.onPageAvgScore,
        errorMessage: snapshot.errorMessage,
      }
    : null;

  const snapshotsList = snapshots.map((s) => ({
    id: s.id,
    createdAt: s.createdAt.toISOString(),
    status: s.status,
    siteScore: s.siteScore,
    onPageCrawledCount: s.onPageCrawledCount,
  }));

  return (
    <SiteAuditClient
      domain={project.domain}
      projectId={project.id}
      projectName={project.name}
      plan={plan}
      pageLimit={pageLimit}
      snapshot={snapshotData}
      snapshots={snapshotsList}
      issues={issues}
      pages={pages}
    />
  );
}
