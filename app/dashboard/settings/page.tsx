import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true, createdAt: true, role: true },
  });

  const member = await prisma.tenantMember.findFirst({
    where: { userId },
    include: { tenant: true },
  });

  const tenant = member?.tenant;

  const tabs = ["Profile", "Workspace", "Billing", "Notifications", "API & Integrations", "Security"];

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Settings</h1>
        <p style={{ fontSize: 15, color: "#64748b" }}>Manage your account and workspace settings</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 32 }}>
        {/* Sidebar tabs */}
        <div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {tabs.map((tab, i) => (
              <button key={tab} style={{
                background: i === 0 ? "#1a56db14" : "transparent",
                color: i === 0 ? "#1a56db" : "#64748b",
                fontWeight: i === 0 ? 700 : 500,
                border: "none",
                borderRadius: 8,
                padding: "11px 14px",
                textAlign: "left",
                fontSize: 14,
                cursor: "pointer",
              }}>
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Profile section */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 24 }}>Profile Information</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
              <div style={{ width: 72, height: 72, background: "linear-gradient(135deg,#1a56db,#7c3aed)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 28 }}>
                {(user?.name ?? user?.email ?? "U")[0].toUpperCase()}
              </div>
              <div>
                <button style={{ background: "#f1f5f9", color: "#374151", border: "1px solid #e2e8f0", padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 6 }}>
                  Upload Photo
                </button>
                <p style={{ fontSize: 12, color: "#94a3b8" }}>JPG, PNG or GIF. Max 2MB.</p>
              </div>
            </div>
            <form style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Full Name</label>
                <input type="text" defaultValue={user?.name ?? ""} style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email Address</label>
                <input type="email" defaultValue={user?.email ?? ""} style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <button type="submit" style={{ background: "#1a56db", color: "#fff", border: "none", padding: "11px 24px", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Workspace section */}
          {tenant && (
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 24 }}>Workspace</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Workspace Name</label>
                  <input type="text" defaultValue={tenant.name} style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Workspace Slug</label>
                  <input type="text" defaultValue={tenant.slug} disabled style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, background: "#f8fafc", boxSizing: "border-box", color: "#94a3b8" }} />
                </div>
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 20 }}>
                {[
                  { label: "Plan", value: tenant.plan },
                  { label: "Your Role", value: member?.role ?? "—" },
                  { label: "Member Since", value: new Date(tenant.createdAt).toLocaleDateString() },
                ].map(s => (
                  <div key={s.label} style={{ background: "#f8fafc", padding: "12px 18px", borderRadius: 8 }}>
                    <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>{s.label}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20 }}>
                <button type="button" style={{ background: "#1a56db", color: "#fff", border: "none", padding: "11px 24px", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Password section */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 24 }}>Change Password</h2>
            <form style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 440 }}>
              {["Current Password", "New Password", "Confirm New Password"].map((label) => (
                <div key={label}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>
                  <input type="password" placeholder="••••••••" style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <button type="submit" style={{ background: "#1a56db", color: "#fff", border: "none", padding: "11px 24px", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                  Update Password
                </button>
              </div>
            </form>
          </div>

          {/* Danger zone */}
          <div style={{ background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 16, padding: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#991b1b", marginBottom: 8 }}>Danger Zone</h2>
            <p style={{ fontSize: 14, color: "#b91c1c", marginBottom: 20, lineHeight: 1.6 }}>
              Deleting your account is permanent and cannot be undone. All your data, projects, and reports will be lost.
            </p>
            <button style={{ background: "#ef4444", color: "#fff", border: "none", padding: "11px 24px", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
