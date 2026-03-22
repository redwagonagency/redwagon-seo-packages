import { auth } from "@/lib/auth";
import { isPrismaMissingTableError, prisma } from "@/lib/prisma";
import { getGscSearchAnalytics } from "@/lib/integrations/google-search-console";
import { getGa4Properties, getGa4Report } from "@/lib/integrations/google-analytics";
import { headers } from "next/headers";

export default async function IntegrationsPage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";
  const proto = headerStore.get("x-forwarded-proto") ?? "https";
  const callbackUri = host ? `${proto}://${host}/api/auth/callback/google` : null;

  let member: any = null;
  try {
    member = await prisma.tenantMember.findFirst({
      where: { userId },
      include: {
        tenant: {
          include: { integrations: true },
        },
      },
    });
  } catch (error) {
    if (isPrismaMissingTableError(error, "Integration")) {
      member = await prisma.tenantMember.findFirst({
        where: { userId },
        include: {
          tenant: true,
        },
      });
    } else {
      throw error;
    }
  }

  const project = await prisma.project.findFirst({
    where: {
      tenant: {
        members: { some: { userId } },
      },
    },
    select: { id: true, domain: true },
  });

  const googleAccount = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { access_token: true },
  });

  const googleAccessToken = googleAccount?.access_token ?? null;

  const integrations = (member?.tenant as { integrations?: Array<{ provider: string; metadata: string | null }> } | null)?.integrations ?? [];
  const hasGoogleOAuth = !!googleAccessToken;
  const connected = (provider: string) => {
    if (provider === "google") return hasGoogleOAuth;
    if (provider === "google-search-console") return hasGoogleOAuth;
    if (provider === "google-analytics") return hasGoogleOAuth;
    if (provider === "facebook") return integrations.some((i) => i.provider === provider);
    return integrations.some((i) => i.provider === provider);
  };

  let gscPreview: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }> = [];
  let gscError: string | null = null;

  if (googleAccessToken && project?.domain) {
    const today = new Date();
    const endDate = today.toISOString().split("T")[0];
    const startDate = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const siteUrls = [
      `https://${project.domain}/`,
      `sc-domain:${project.domain}`,
      `https://www.${project.domain}/`,
    ];

    for (const siteUrl of siteUrls) {
      try {
        const gscData = await getGscSearchAnalytics(googleAccessToken, siteUrl, startDate, endDate, ["query"]);
        if (gscData?.error) continue;
        const rows = (gscData?.rows ?? []) as Record<string, unknown>[];
        gscPreview = rows.slice(0, 10).map((row) => ({
          query: (row.keys as string[])?.[0] ?? "",
          clicks: Number(row.clicks ?? 0),
          impressions: Number(row.impressions ?? 0),
          ctr: Number(row.ctr ?? 0),
          position: Number(row.position ?? 0),
        })).filter((r) => r.query.length > 0);
        break;
      } catch {
        continue;
      }
    }

    if (gscPreview.length === 0) {
      gscError = "No Search Console rows found for this project domain.";
    }
  }

  const gaIntegration = integrations.find((i) => i.provider === "google-analytics");
  let gaPropertyId: string | null = null;
  if (gaIntegration?.metadata) {
    try {
      const parsed = JSON.parse(gaIntegration.metadata) as { propertyId?: string };
      gaPropertyId = parsed.propertyId ?? null;
    } catch {
      gaPropertyId = null;
    }
  }

  // Auto-discover a GA4 property if metadata wasn't configured yet.
  if (googleAccessToken && !gaPropertyId) {
    try {
      const propertiesData = await getGa4Properties(googleAccessToken) as {
        properties?: Array<{ name?: string; displayName?: string }>;
      };
      const firstProperty = propertiesData.properties?.[0]?.name ?? null;
      if (firstProperty) {
        gaPropertyId = firstProperty.replace("properties/", "");
      }
    } catch {
      // Keep GA disabled when property discovery fails.
    }
  }

  let gaSummary: { sessions: number; activeUsers: number; avgBounceRate: number | null } | null = null;
  let gaError: string | null = null;

  if (googleAccessToken && gaPropertyId) {
    try {
      const today = new Date();
      const endDate = today.toISOString().split("T")[0];
      const startDate = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const report = await getGa4Report(googleAccessToken, gaPropertyId, startDate, endDate) as {
        rows?: Array<{ metricValues?: Array<{ value?: string }> }>;
      };

      const rows = report.rows ?? [];
      let sessions = 0;
      let activeUsers = 0;
      let bounceTotal = 0;
      let bounceRows = 0;

      for (const row of rows) {
        const metrics = row.metricValues ?? [];
        sessions += Number(metrics[0]?.value ?? 0);
        activeUsers += Number(metrics[1]?.value ?? 0);
        const bounce = Number(metrics[2]?.value ?? 0);
        if (!Number.isNaN(bounce) && bounce > 0) {
          bounceTotal += bounce;
          bounceRows += 1;
        }
      }

      gaSummary = {
        sessions,
        activeUsers,
        avgBounceRate: bounceRows > 0 ? Math.round((bounceTotal / bounceRows) * 1000) / 10 : null,
      };
    } catch {
      gaError = "Unable to fetch GA4 report with the configured property ID.";
    }
  } else if (googleAccessToken && !gaPropertyId) {
    gaError = "GA4 property not configured. Save provider metadata with a propertyId to enable GA4 dashboards.";
  }

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

      {callbackUri && (
        <div style={{ background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 12, padding: "14px 18px", marginBottom: 24 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#9a3412", fontWeight: 700 }}>Google OAuth setup note</p>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#7c2d12" }}>
            If you see <strong>redirect_uri_mismatch</strong>, add this exact Authorized redirect URI in Google Cloud OAuth client settings:
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#9a3412", fontFamily: "monospace" }}>{callbackUri}</p>
        </div>
      )}

      {/* Live data previews */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, color: "#0f172a" }}>GSC Top Queries (Last 28 Days)</div>
          {!googleAccessToken ? (
            <div style={{ padding: 16, fontSize: 13, color: "#94a3b8" }}>Connect a Google account to load Search Console query data.</div>
          ) : gscPreview.length === 0 ? (
            <div style={{ padding: 16, fontSize: 13, color: "#94a3b8" }}>{gscError ?? "No GSC data available."}</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Query", "Clicks", "Impr.", "Pos"].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gscPreview.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: "#0f172a" }}>{row.query}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: "#374151" }}>{row.clicks.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: "#374151" }}>{row.impressions.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: "#374151" }}>{row.position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, color: "#0f172a" }}>GA4 Snapshot (Last 28 Days)</div>
          {!googleAccessToken ? (
            <div style={{ padding: 16, fontSize: 13, color: "#94a3b8" }}>Connect a Google account to load GA4 metrics.</div>
          ) : gaSummary ? (
            <div style={{ padding: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 10px" }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Sessions</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{gaSummary.sessions.toLocaleString()}</div>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 10px" }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Active Users</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{gaSummary.activeUsers.toLocaleString()}</div>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 10px" }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Avg Bounce</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{gaSummary.avgBounceRate !== null ? `${gaSummary.avgBounceRate}%` : "—"}</div>
                </div>
              </div>
              {gaPropertyId && <p style={{ marginTop: 10, fontSize: 11, color: "#94a3b8" }}>Property: {gaPropertyId}</p>}
            </div>
          ) : (
            <div style={{ padding: 16, fontSize: 13, color: "#94a3b8" }}>{gaError ?? "No GA4 data available."}</div>
          )}
        </div>
      </div>

      {/* Integration cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
        {availableIntegrations.map(integration => {
          const isConnected = connected(integration.id);
          const connectHref = integration.id === "facebook"
            ? "/api/auth/signin/facebook?callbackUrl=%2Fdashboard%2Fintegrations"
            : "/api/auth/signin/google?callbackUrl=%2Fdashboard%2Fintegrations";

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
              <a href={connectHref} style={{
                display: "block",
                textAlign: "center",
                width: "100%",
                background: isConnected ? "#f8fafc" : integration.color,
                color: isConnected ? "#64748b" : "#ffffff",
                border: isConnected ? "1px solid #e2e8f0" : "none",
                padding: "12px 0",
                borderRadius: 9,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                textDecoration: "none",
              }}>
                {isConnected ? "Manage Connection" : `Connect ${integration.name}`}
              </a>
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
