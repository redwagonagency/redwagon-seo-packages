import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();
  const user = session?.user as { id: string; role: string } | undefined;

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
    redirect("/dashboard");
  }

  const [userCount, tenantCount, projectCount] = await Promise.all([
    prisma.user.count(),
    prisma.tenant.count(),
    prisma.project.count(),
  ]);

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
      {/* Header */}
      <header style={{ background: "#0d1b2a", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#1a56db,#06b6d4)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <span style={{ color: "#ffffff", fontWeight: 700, fontSize: 16 }}>SearchAuditPro <span style={{ color: "#f59e0b", fontSize: 12 }}>Admin</span></span>
        </div>
        <span style={{ color: "#94a3b8", fontSize: 14 }}>{session?.user?.email}</span>
      </header>

      <div style={{ padding: "32px 36px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 32 }}>Admin Dashboard</h1>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 40 }}>
          {[
            { label: "Total Users", value: userCount, icon: "👤", color: "#1a56db" },
            { label: "Workspaces", value: tenantCount, icon: "🏢", color: "#7c3aed" },
            { label: "Projects", value: projectCount, icon: "📁", color: "#059669" },
          ].map(s => (
            <div key={s.label} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "24px 28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>{s.label}</span>
                <div style={{ width: 40, height: 40, background: `${s.color}14`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                  {s.icon}
                </div>
              </div>
              <p style={{ fontSize: 36, fontWeight: 800, color: "#0f172a" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Users */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Recent Registrations</h2>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Name", "Email", "Role", "Joined"].map(col => (
                  <th key={col} style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < recentUsers.length - 1 ? "1px solid #f8fafc" : "none" }}>
                  <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{u.name ?? "—"}</td>
                  <td style={{ padding: "14px 20px", fontSize: 14, color: "#374151" }}>{u.email}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{
                      background: u.role === "SUPERADMIN" ? "#fef3c7" : u.role === "ADMIN" ? "#dbeafe" : "#f1f5f9",
                      color: u.role === "SUPERADMIN" ? "#92400e" : u.role === "ADMIN" ? "#1e40af" : "#64748b",
                      padding: "3px 10px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: "#64748b" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
