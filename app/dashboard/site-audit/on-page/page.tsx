import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { parsePages, type PageAuditResult } from "@/lib/reports/types";
import OnPageAnalyzer from "@/components/dashboard/OnPageAnalyzer";
import RunReportButton from "@/components/dashboard/RunReportButton";

const PLAN_PAGE_LIMITS: Record<string, number> = {
  STARTER: 10, PRO: 50, ENTERPRISE: 100, AGENCY: 500, ADMIN: 9999,
};

export default async function OnPageOptPage() {
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

  const plan = (member?.tenant as { plan?: string } | undefined)?.plan ?? "STARTER";
  const pageLimit = PLAN_PAGE_LIMITS[plan] ?? 10;
  const project = member?.tenant?.projects?.[0] ?? null;
  const snapshot = project?.reportSnapshots?.[0] ?? null;
  const pages: PageAuditResult[] = parsePages(snapshot?.onPagePagesJson ?? null);

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Link href="/dashboard/site-audit" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>
              Site Audit
            </Link>
            <span style={{ color: "#cbd5e1" }}>›</span>
            <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>On-Page Opt.</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>On-Page Optimization</h1>
          <p style={{ fontSize: 15, color: "#64748b" }}>
            {pages.length > 0
              ? `${pages.length} pages crawled — select pages to run on-page analysis`
              : `Up to ${pageLimit === 9999 ? "unlimited" : pageLimit} pages crawled per report on your ${plan} plan`}
          </p>
        </div>
        {project && (
          <RunReportButton
            projectId={project.id}
            projectName={project.name}
            lastRunAt={snapshot?.createdAt?.toString() ?? null}
          />
        )}
      </div>

      {!project ? (
        <div style={{ background: "#fff", border: "2px dashed #e2e8f0", borderRadius: 16, padding: "60px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>No project found</h2>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Create a project first to run on-page analysis.</p>
          <Link href="/dashboard/projects" style={{ background: "#1a56db", color: "#fff", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Create Project
          </Link>
        </div>
      ) : pages.length === 0 ? (
        <div style={{ background: "#fff", border: "2px dashed #e2e8f0", borderRadius: 16, padding: "60px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>No pages crawled yet</h2>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 6 }}>
            Run a Site Audit report to crawl your sitemap.
          </p>
          <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24 }}>
            Your <b>{plan}</b> plan crawls up to <b>{pageLimit === 9999 ? "unlimited" : pageLimit}</b> pages per report.
          </p>
          <Link href="/dashboard/site-audit" style={{ background: "#1a56db", color: "#fff", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Go to Site Audit
          </Link>
        </div>
      ) : (
        <OnPageAnalyzer pages={pages} projectId={project.id} plan={plan} />
      )}
    </div>
  );
}
