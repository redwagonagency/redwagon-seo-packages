import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function IntegrationsPage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const member = await prisma.tenantMember.findFirst({
    where: { userId },
    include: {
      tenant: {
        include: { integrations: true },
      },
    },
  });

  const integrations = member?.tenant?.integrations ?? [];
  const connected = (provider: string) => integrations.some(i => i.provider === provider);

  const availableIntegrations = [
    {
      id: "google-search-console",
      name: "Google Search Console",
      description: "Import impressions, clicks, CTR, and keyword positions directly from GSC.",
      icon: "🔍",
      color: "#4285F4",
      features: ["Keyword performance data", "Click & impression trends", "Search appearance breakdown"],
      category: "Analytics",
    },
    {
      id: "google-analytics",
      name: "Google Analytics 4",
      description: "Connect GA4 to see conversions, sessions, bounce rates, and traffic sources.",
      icon: "📊",
      color: "#E37400",
      features: ["Conversion tracking", "Traffic source analysis", "User behavior metrics"],
      category: "Analytics",
    },
    {
      id: "google",
      name: "Google (OAuth)",
      description: "Single sign-on and access to all Google services with one OAuth connection.",
      icon: "🔑",
      color: "#34A853",
      features: ["Single sign-on", "GSC access", "GA4 access"],
      category: "Auth",
    },
    {
      id: "facebook",
      name: "Facebook",
      description: "Login with Facebook and track social traffic impact on your SEO metrics.",
      icon: "👤",
      color: "#1877F2",
      features: ["Social login", "Traffic attribution"],
      category: "Social",
    },
  ];

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Integrations</h1>
        <p style={{ fontSize: 15, color: "#64748b" }}>Connect your tools to get unified SEO insights</p>
      </div>

      {/* Connected summary */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 24px", marginBottom: 32, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 42, height: 42, background: "#10b98114", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔌</div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>
            {integrations.length} integration{integrations.length !== 1 ? "s" : ""} connected
          </p>
          <p style={{ fontSize: 13, color: "#64748b" }}>Connect GSC and GA4 to unlock full dashboard metrics</p>
        </div>
      </div>

      {/* Integration cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
        {availableIntegrations.map(integration => {
          const isConnected = connected(integration.id);
          return (
            <div key={integration.id} style={{ background: "#ffffff", border: `1px solid ${isConnected ? "#10b981" : "#e2e8f0"}`, borderRadius: 16, padding: 28, position: "relative" }}>
              {isConnected && (
                <div style={{ position: "absolute", top: 16, right: 16, background: "#d1fae5", color: "#065f46", padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                  Connected
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <div style={{ width: 50, height: 50, background: `${integration.color}14`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
                  {integration.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{integration.name}</h3>
                  <span style={{ fontSize: 11, background: "#f1f5f9", color: "#64748b", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                    {integration.category}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 16 }}>{integration.description}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px" }}>
                {integration.features.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13, color: "#374151" }}>
                    <span style={{ color: "#10b981", fontWeight: 700, fontSize: 14 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button style={{
                width: "100%",
                background: isConnected ? "#f8fafc" : integration.color,
                color: isConnected ? "#64748b" : "#ffffff",
                border: isConnected ? "1px solid #e2e8f0" : "none",
                padding: "12px 0",
                borderRadius: 9,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}>
                {isConnected ? "Manage Connection" : `Connect ${integration.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Coming soon */}
      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Coming Soon</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {["Shopify", "HubSpot", "Slack", "Zapier"].map(name => (
            <div key={name} style={{ background: "#f8fafc", border: "1px dashed #e2e8f0", borderRadius: 12, padding: 20, textAlign: "center" }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#94a3b8", marginBottom: 4 }}>{name}</p>
              <p style={{ fontSize: 12, color: "#cbd5e1" }}>Coming soon</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
