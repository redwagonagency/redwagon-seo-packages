import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Ga4Row {
  page: string;
  sessions: number;
  pageviews: number;
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

async function getGa4Properties(token: string): Promise<{ name: string; displayName: string; propertyId: string }[]> {
  // List accessible GA4 properties via Admin API
  const res = await fetch(
    "https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:accounts/-&pageSize=50",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { properties?: { name: string; displayName: string }[] };
  return (data.properties ?? []).map((p) => ({
    name: p.name,
    displayName: p.displayName,
    propertyId: p.name.replace("properties/", ""),
  }));
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { access_token: true, refresh_token: true },
  });

  if (!account) {
    return Response.json({ error: "No Google account connected. Sign in with Google to enable GA4.", notConnected: true }, { status: 400 });
  }

  let token = account.access_token;

  if (!token && account.refresh_token) {
    token = await refreshAccessToken(account.refresh_token);
  }

  if (!token) {
    return Response.json({ error: "Google access token unavailable. Please sign out and sign back in with Google.", notConnected: true }, { status: 400 });
  }

  // Get list of GA4 properties
  const properties = await getGa4Properties(token);

  if (properties.length === 0) {
    return Response.json({
      rows: [],
      message: "No GA4 properties found. Make sure your Google account has access to a GA4 property.",
    });
  }

  // Use first accessible property
  const property = properties[0];

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);

  const reportRes = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${property.propertyId}:runReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRanges: [{ startDate: startDate.toISOString().slice(0, 10), endDate: endDate.toISOString().slice(0, 10) }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "sessions" }, { name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 100,
      }),
    }
  );

  if (!reportRes.ok) {
    // Try token refresh
    if (reportRes.status === 401 && account.refresh_token) {
      const newToken = await refreshAccessToken(account.refresh_token);
      if (!newToken) return Response.json({ error: "Google token expired. Please sign out and sign back in." }, { status: 401 });
      token = newToken;

      // Retry
      const retryRes = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${property.propertyId}:runReport`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            dateRanges: [{ startDate: startDate.toISOString().slice(0, 10), endDate: endDate.toISOString().slice(0, 10) }],
            dimensions: [{ name: "pagePath" }],
            metrics: [{ name: "sessions" }, { name: "screenPageViews" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
            limit: 100,
          }),
        }
      );
      if (!retryRes.ok) {
        const errText = await retryRes.text();
        return Response.json({ error: `GA4 error: ${errText.slice(0, 200)}` }, { status: 500 });
      }
      const retryData = (await retryRes.json()) as {
        rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[];
      };
      const rows: Ga4Row[] = (retryData.rows ?? []).map((r) => ({
        page: r.dimensionValues[0]?.value ?? "",
        sessions: parseInt(r.metricValues[0]?.value ?? "0", 10),
        pageviews: parseInt(r.metricValues[1]?.value ?? "0", 10),
      }));
      return Response.json({ rows, propertyId: property.propertyId, propertyName: property.displayName });
    }

    const errText = await reportRes.text();
    return Response.json({ error: `GA4 report error: ${errText.slice(0, 200)}` }, { status: 500 });
  }

  const reportData = (await reportRes.json()) as {
    rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[];
  };

  const rows: Ga4Row[] = (reportData.rows ?? []).map((r) => ({
    page: r.dimensionValues[0]?.value ?? "",
    sessions: parseInt(r.metricValues[0]?.value ?? "0", 10),
    pageviews: parseInt(r.metricValues[1]?.value ?? "0", 10),
  }));

  return Response.json({ rows, propertyId: property.propertyId, propertyName: property.displayName });
}
