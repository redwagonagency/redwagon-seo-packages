import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function SuperAdminPage() {
  const session = await auth();
  const user = session?.user as { id: string; role: string } | undefined;

  if (!user || user.role !== "SUPERADMIN") {
    redirect("/dashboard");
  }

  const [userCount, tenantCount, projectCount, auditCount, backlinkCount, rankTrackerCount] = await Promise.all([
    prisma.user.count(),
    prisma.tenant.count(),
    prisma.project.count(),
    prisma.siteAudit.count(),
    prisma.backlinkAudit.count(),
    prisma.rankTracker.count(),
  ]);

  const allTenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { members: true, projects: true } },
    },
    take: 20,
  });

  const planColors: Record<string, string> = {
    STARTER: "#3b82f6",
    PROFESSIONAL: "#7c3aed",
    ENTERPRISE: "#059669",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1a" }}>
      {/* Header */}
      <header style={{ background: "#0d1b2a", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#1a56db,#06b6d4)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <span style={{ color: "#ffffff", fontWeight: 700, fontSize: 16 }}>
            SearchAuditPro <span style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SuperAdmin</span>
          </span>
        </div>
        <span style={{ color: "#94a3b8", fontSize: 13 }}>{session?.user?.email}</span>
      </header>

      <div style={{ padding: "32px 36px" }}>
        {/* Warning banner */}
        <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, padding: "12px 20px", marginBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <p style={{ fontSize: 14, color: "#fbbf24" }}>
            <strong>SuperAdmin Mode.</strong> You have elevated access to all tenant and user data. Handle with care.
          </p>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#ffffff", marginBottom: 32 }}>Platform Overview</h1>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16, marginBottom: 40 }}>
          {[
            { label: "Users", value: userCount, color: "#1a56db" },
            { label: "Workspaces", value: tenantCount, color: "#7c3aed" },
            { label: "Projects", value: projectCount, color: "#059669" },
            { label: "Site Audits", value: auditCount, color: "#0891b2" },
            { label: "Backlink Audits", value: backlinkCount, color: "#d97706" },
            { label: "Rank Trackers", value: rankTrackerCount, color: "#e11d48" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "18px 16px" }}>
              <p style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>{s.label}</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: "#ffffff" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tenants table */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#ffffff" }}>All Workspaces</h2>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                {["Workspace", "Slug", "Plan", "Members", "Projects", "Trial Ends", "Created"].map(col => (
                  <th key={col} style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allTenants.map((t, i) => (
                <tr key={t.id} style={{ borderBottom: i < allTenants.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{t.name}</td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: "#64748b", fontFamily: "monospace" }}>{t.slug}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{
                      background: `${planColors[t.plan] ?? "#64748b"}20`,
                      color: planColors[t.plan] ?? "#64748b",
                      padding: "3px 10px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                    }}>
                      {t.plan}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 14, color: "#94a3b8" }}>{t._count.members}</td>
                  <td style={{ padding: "14px 20px", fontSize: 14, color: "#94a3b8" }}>{t._count.projects}</td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: "#94a3b8" }}>
                    {t.trialEndsAt ? new Date(t.trialEndsAt).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: "#64748b" }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
