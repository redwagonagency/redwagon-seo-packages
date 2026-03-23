import { auth } from "@/lib/auth";
import { logApiQuery } from "@/lib/api-query-log";
import { prisma } from "@/lib/prisma";
import { getSelectedSiteForUser } from "@/lib/site-context";

interface Ga4Row {
  page: string;
  sessions: number;
  pageviews: number;
}

function parseRequestBody(body: BodyInit | null | undefined): unknown {
  if (!body) return null;
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  return "[non-text body]";
}

async function fetchGoogleLogged(params: {
  userId: string;
  siteId?: string | null;
  useCase: string;
  url: string;
  init?: RequestInit;
}) {
  const startedAt = Date.now();
  const method = params.init?.method ?? "GET";
  const requestBody = parseRequestBody(params.init?.body ?? null);
  const response = await fetch(params.url, params.init);
  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  void logApiQuery({
    userId: params.userId,
    siteId: params.siteId ?? null,
    provider: "google",
    method,
    endpoint: params.url,
    queryKey: params.url,
    useCase: params.useCase,
    durationMs: Date.now() - startedAt,
    statusCode: response.status,
    success: response.ok,
    requestBody,
    responseBody: json,
    errorMessage: response.ok ? null : (typeof text === "string" ? text.slice(0, 500) : null),
  });

  return { response, text, json };
}

async function refreshAccessToken(refreshToken: string, userId?: string, siteId?: string | null): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const { response, json } = await fetchGoogleLogged({
    userId: userId ?? "unknown",
    siteId: siteId ?? null,
    useCase: "google_oauth_refresh",
    url: "https://oauth2.googleapis.com/token",
    init: {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    },
  });
  if (!response.ok) return null;
  const data = (json ?? {}) as { access_token?: string };
  return data.access_token ?? null;
}

async function getGa4Properties(token: string, userId: string, siteId?: string | null): Promise<{ name: string; displayName: string; propertyId: string }[]> {
  // List accessible GA4 properties via Admin API
  const { response, json } = await fetchGoogleLogged({
    userId,
    siteId,
    useCase: "ga4_properties_list",
    url: "https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:accounts/-&pageSize=50",
    init: { headers: { Authorization: `Bearer ${token}` } },
  });
  if (!response.ok) return [];
  const data = (json ?? {}) as { properties?: { name: string; displayName: string }[] };
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
  const selectedSite = await getSelectedSiteForUser(userId);
  const selectedSiteId = selectedSite?.id ?? null;

  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { access_token: true, refresh_token: true },
  });

  if (!account) {
    return Response.json({ error: "No Google account connected. Sign in with Google to enable GA4.", notConnected: true }, { status: 400 });
  }

  let token = account.access_token;

  if (!token && account.refresh_token) {
    token = await refreshAccessToken(account.refresh_token, userId, selectedSiteId);
  }

  if (!token) {
    return Response.json({ error: "Google access token unavailable. Please sign out and sign back in with Google.", notConnected: true }, { status: 400 });
  }

  // Get list of GA4 properties
  const properties = await getGa4Properties(token, userId, selectedSiteId);

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

  const reportResult = await fetchGoogleLogged({
    userId,
    siteId: selectedSiteId,
    useCase: "ga4_run_report",
    url: `https://analyticsdata.googleapis.com/v1beta/properties/${property.propertyId}:runReport`,
    init: {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRanges: [{ startDate: startDate.toISOString().slice(0, 10), endDate: endDate.toISOString().slice(0, 10) }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "sessions" }, { name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 100,
      }),
    },
  });

  if (!reportResult.response.ok) {
    // Try token refresh
    if (reportResult.response.status === 401 && account.refresh_token) {
      const newToken = await refreshAccessToken(account.refresh_token, userId, selectedSiteId);
      if (!newToken) return Response.json({ error: "Google token expired. Please sign out and sign back in." }, { status: 401 });
      token = newToken;

      // Retry
      const retryResult = await fetchGoogleLogged({
        userId,
        siteId: selectedSiteId,
        useCase: "ga4_run_report_retry",
        url: `https://analyticsdata.googleapis.com/v1beta/properties/${property.propertyId}:runReport`,
        init: {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            dateRanges: [{ startDate: startDate.toISOString().slice(0, 10), endDate: endDate.toISOString().slice(0, 10) }],
            dimensions: [{ name: "pagePath" }],
            metrics: [{ name: "sessions" }, { name: "screenPageViews" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
            limit: 100,
          }),
        },
      });
      if (!retryResult.response.ok) {
        const errText = retryResult.text;
        return Response.json({ error: `GA4 error: ${errText.slice(0, 200)}` }, { status: 500 });
      }
      const retryData = (retryResult.json ?? {}) as {
        rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[];
      };
      const rows: Ga4Row[] = (retryData.rows ?? []).map((r) => ({
        page: r.dimensionValues[0]?.value ?? "",
        sessions: parseInt(r.metricValues[0]?.value ?? "0", 10),
        pageviews: parseInt(r.metricValues[1]?.value ?? "0", 10),
      }));
      return Response.json({ rows, propertyId: property.propertyId, propertyName: property.displayName });
    }

    const errText = reportResult.text;
    return Response.json({ error: `GA4 report error: ${errText.slice(0, 200)}` }, { status: 500 });
  }

  const reportData = (reportResult.json ?? {}) as {
    rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[];
  };

  const rows: Ga4Row[] = (reportData.rows ?? []).map((r) => ({
    page: r.dimensionValues[0]?.value ?? "",
    sessions: parseInt(r.metricValues[0]?.value ?? "0", 10),
    pageviews: parseInt(r.metricValues[1]?.value ?? "0", 10),
  }));

  return Response.json({ rows, propertyId: property.propertyId, propertyName: property.displayName });
}
