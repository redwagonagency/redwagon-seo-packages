import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user!;

  // Get user's tenant and projects
  const member = await prisma.tenantMember.findFirst({
    where: { userId: (user as { id: string }).id },
    include: {
      tenant: {
        include: {
          projects: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      },
    },
  });

  const tenant = member?.tenant;
  const projects = tenant?.projects ?? [];

  const statCards = [
    { label: "Projects", value: projects.length, icon: "📁", color: "#1a56db", href: "/dashboard/projects" },
    { label: "Keywords Tracked", value: "0", icon: "📈", color: "#0891b2", href: "/dashboard/rank-tracking" },
    { label: "Backlinks Indexed", value: "0", icon: "🔗", color: "#7c3aed", href: "/dashboard/backlinks" },
    { label: "Active Audits", value: "0", icon: "🔍", color: "#059669", href: "/dashboard/site-audit" },
  ];

  const quickActions = [
    { label: "Run Site Audit", desc: "Crawl a domain and find SEO issues", href: "/dashboard/site-audit", icon: "🔍", color: "#1a56db" },
    { label: "Track Keywords", desc: "Add keywords and monitor rankings", href: "/dashboard/rank-tracking", icon: "📈", color: "#0891b2" },
    { label: "Analyze Backlinks", desc: "View your full backlink profile", href: "/dashboard/backlinks", icon: "🔗", color: "#7c3aed" },
    { label: "LLM Visibility", desc: "Check your AI search presence", href: "/dashboard/llm-visibility", icon: "🤖", color: "#059669" },
    { label: "Local SEO", desc: "Audit your citations and listings", href: "/dashboard/local-seo", icon: "📍", color: "#d97706" },
    { label: "Connect Integrations", desc: "Link GSC and GA4", href: "/dashboard/integrations", icon: "🔌", color: "#e11d48" },
  ];

  return (
    <div style={{ padding: "32px 36px" }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
          Welcome back, {user.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p style={{ fontSize: 15, color: "#64748b" }}>
          {tenant ? `${tenant.name} • ${tenant.plan} Plan` : "Set up your workspace to get started."}
          {tenant?.trialEndsAt && new Date(tenant.trialEndsAt) > new Date() && (
            <span style={{ marginLeft: 12, background: "#fef3c7", color: "#92400e", padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
              Trial ends {new Date(tenant.trialEndsAt).toLocaleDateString()}
            </span>
          )}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 40 }}>
        {statCards.map(card => (
          <Link key={card.label} href={card.href} style={{ textDecoration: "none" }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "22px 24px", transition: "box-shadow 0.15s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>{card.label}</span>
                <div style={{ width: 36, height: 36, background: `${card.color}14`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                  {card.icon}
                </div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a" }}>{card.value}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28 }}>
        {/* Quick Actions */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Quick Actions</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {quickActions.map(action => (
              <Link key={action.label} href={action.href} style={{ textDecoration: "none" }}>
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 42, height: 42, background: `${action.color}14`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {action.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>{action.label}</p>
                    <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{action.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Recent Projects</h2>
            <Link href="/dashboard/projects" style={{ fontSize: 13, color: "#1a56db", textDecoration: "none", fontWeight: 600 }}>View all</Link>
          </div>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
            {projects.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📁</div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>No projects yet</p>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Create your first project to start tracking SEO.</p>
                <Link href="/dashboard/projects" style={{ background: "#1a56db", color: "#fff", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                  Create Project
                </Link>
              </div>
            ) : (
              projects.map((project, i) => (
                <div key={project.id} style={{ padding: "16px 20px", borderBottom: i < projects.length - 1 ? "1px solid #f1f5f9" : "none", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 36, height: 36, background: "#1a56db14", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🌐</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{project.name}</p>
                    <p style={{ fontSize: 12, color: "#64748b" }}>{project.domain}</p>
                  </div>
                  <Link href={`/dashboard/projects`} style={{ fontSize: 12, color: "#1a56db", textDecoration: "none" }}>Open →</Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
